import crypto from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { retry } from '../utils/retry.js';
import { NombaAuthService } from './NombaAuthService.js';

type NombaWebhookPayload = {
  event_type?: string;
  requestId?: string;
  data?: {
    merchant?: {
      userId?: string;
      walletId?: string;
    };
    transaction?: {
      aliasAccountNumber?: string;
      transactionId?: string;
      transactionAmount?: number | string;
      currency?: string;
      type?: string;
      time?: string;
      responseCode?: string | null;
    };
    order?: {
      currency?: string;
    };
  };
};

type WebhookEventRow = {
  id: string;
  request_id: string | null;
  event_type: string | null;
  transaction_id: string | null;
  account_number: string | null;
  amount: number | string | null;
  status: string;
  payload: NombaWebhookPayload;
  attempt_count: number;
};

type TransactionVerificationResponse = {
  code?: string;
  description?: string;
  data?: {
    status?: string;
    amount?: number | string;
    currency?: string;
    walletCurrency?: string;
    timeCreated?: string;
    [key: string]: unknown;
  } | null;
};

type VirtualAccountLookupRow = {
  internal_user_id: string;
  bank_account_number: string;
};

type ConfirmedPayment = {
  provider: 'nomba';
  eventId: string;
  transactionId: string;
  userId: string;
  accountNumber: string;
  amount: number;
  currency: string;
  paidAt: string;
};

type ReceiveInput = {
  rawBody: unknown;
  headers: IncomingHttpHeaders;
};

type ReceiveResult = {
  eventId: string;
  status: string;
  wasDuplicate: boolean;
};

const maxProcessingAttempts = 3;
const retryDelayMs = 1_000;

export class NombaWebhookService {
    nombaAuthService: NombaAuthService;

    constructor() {
        this.nombaAuthService = new NombaAuthService();
    }

    async receive({ rawBody, headers }: ReceiveInput): Promise<ReceiveResult> {
        if (!Buffer.isBuffer(rawBody)) {
            throw new AppError('Webhook body must be application/json.', 400);
        }

        const rawPayload = rawBody.toString('utf8');
        const payload = this.#parsePayload(rawPayload);

        this.#verifySignature({ payload, headers });

        const saved = await this.#saveWebhookEvent({ payload, rawPayload, headers });

        if (!saved.wasDuplicate) {
            this.#processInBackground(saved.eventId);
        }

        return {
            eventId: saved.eventId,
            status: saved.status,
            wasDuplicate: saved.wasDuplicate,
        };
    }

    async processEvent(eventId: string): Promise<void> {
        for (let attempt = 1; attempt <= maxProcessingAttempts; attempt += 1) {
            try {
                await this.#markAttemptStarted(eventId, attempt);
                const event = await this.#getWebhookEvent(eventId);

                if (event.status === 'processed') {
                    return;
                }

                const confirmedPayment = await this.#buildConfirmedPayment(event);

                // Credit the user's balance and log funding history via RPC
                const { data: creditResult, error: creditError } = await retry(
                    async () => {
                        const res = await supabase.rpc('credit_user_balance', {
                            p_internal_user_id: confirmedPayment.userId,
                            p_amount: confirmedPayment.amount,
                            p_webhook_event_id: eventId,
                        });
                        return res;
                    },
                    { retries: 3, delayMs: 200 },
                );

                if (creditError) {
                    throw new Error(`Failed to credit user balance via RPC: ${creditError.message}`);
                }

                const creditResultObj = creditResult as { success: boolean; reason?: string };
                if (creditResultObj && !creditResultObj.success) {
                    throw new Error(`Failed to credit user balance: ${creditResultObj.reason ?? 'Unknown reason'}`);
                }

                await supabase
                    .from('nomba_webhook_events')
                    .update({
                        status: 'processed',
                        confirmed_payment: confirmedPayment,
                        last_error: null,
                        processed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', eventId);

                console.log('Confirmed Nomba payment ready for Task 2 handoff:', confirmedPayment);
                return;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown webhook processing error';
                await this.#recordProcessingError(eventId, attempt, message);

                if (attempt === maxProcessingAttempts) {
                    await this.#moveToFailedEvents(eventId, message);
                    return;
                }

                await this.#delay(retryDelayMs * attempt);
            }
        }
    }

    #parsePayload(rawPayload: string): NombaWebhookPayload {
        try {
            return JSON.parse(rawPayload) as NombaWebhookPayload;
        } catch {
            throw new AppError('Invalid JSON webhook payload.', 400);
        }
    }

    #verifySignature({
        payload,
        headers,
    }: {
    payload: NombaWebhookPayload;
    headers: IncomingHttpHeaders;
  }): void {
        if (!env.nomba.webhookSecret) {
            throw new AppError('Nomba webhook secret is not configured.', 500);
        }

        const receivedSignature = this.#getHeader(headers, 'nomba-signature');
        const timestampStr = this.#getHeader(headers, 'nomba-timestamp');

        if (!receivedSignature || !timestampStr) {
            throw new AppError('Missing Nomba webhook signature headers.', 401);
        }

        const timestamp = Number(timestampStr);
        if (Number.isNaN(timestamp)) {
            throw new AppError('Invalid Nomba webhook timestamp.', 401);
        }

        // Webhook Replay Protection: Reject if timestamp is older than 5 minutes (300,000 ms)
        // or if it is suspiciously in the future (allow 1 minute clock drift).
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        const oneMinute = 60 * 1000;
        
        if (now - timestamp > fiveMinutes) {
            throw new AppError('Webhook timestamp is too old. Possible replay attack.', 401);
        }
        if (timestamp - now > oneMinute) {
            throw new AppError('Webhook timestamp is in the future.', 401);
        }

        const generatedSignature = this.#generateSignature(payload, env.nomba.webhookSecret, timestampStr);

        if (!this.#safeEqual(receivedSignature, generatedSignature)) {
            throw new AppError('Invalid Nomba webhook signature.', 401);
        }
    }

    #generateSignature(payload: NombaWebhookPayload, secret: string, timestamp: string): string {
        const transaction = payload.data?.transaction ?? {};
        const merchant = payload.data?.merchant ?? {};
        const responseCode = transaction.responseCode === 'null'
            ? ''
            : transaction.responseCode ?? '';

        const hashingPayload = [
            payload.event_type ?? '',
            payload.requestId ?? '',
            merchant.userId ?? '',
            merchant.walletId ?? '',
            transaction.transactionId ?? '',
            transaction.type ?? '',
            transaction.time ?? '',
            responseCode,
            timestamp,
        ].join(':');

        return crypto
            .createHmac('sha256', secret)
            .update(hashingPayload)
            .digest('base64');
    }

    #safeEqual(receivedSignature: string, generatedSignature: string): boolean {
        // We know the expected HMAC-SHA256 Base64 hash is exactly 44 bytes.
        // To prevent length-based early return timing leaks, we enforce comparison 
        // with a dummy valid-length buffer if the received string is invalid.
        
        let received = Buffer.from(receivedSignature);
        const generated = Buffer.from(generatedSignature);
        
        const EXPECTED_LENGTH = 44;
        let isLengthMatch = true;

        if (received.length !== EXPECTED_LENGTH) {
            isLengthMatch = false;
            // Pad or allocate a dummy buffer to ensure timingSafeEqual still runs
            received = Buffer.alloc(EXPECTED_LENGTH, 0);
        }
        
        if (generated.length !== EXPECTED_LENGTH) {
            // Should never happen theoretically as it's generated internally, but safety first
            return false;
        }

        const isHashMatch = crypto.timingSafeEqual(received, generated);

        return isLengthMatch && isHashMatch;
    }

    async #saveWebhookEvent({
        payload,
        rawPayload,
        headers,
    }: {
    payload: NombaWebhookPayload;
    rawPayload: string;
    headers: IncomingHttpHeaders;
  }): Promise<ReceiveResult> {
        const transaction = payload.data?.transaction;
        const requestId = payload.requestId ?? null;
        const transactionId = transaction?.transactionId ?? null;

        const { data, error } = await supabase
            .from('nomba_webhook_events')
            .insert({
                request_id: requestId,
                event_type: payload.event_type ?? null,
                transaction_id: transactionId,
                account_number: transaction?.aliasAccountNumber ?? null,
                amount: this.#normalizeAmountForStorage(transaction?.transactionAmount),
                status: 'pending',
                headers: this.#serializeHeaders(headers),
                payload,
                raw_payload: rawPayload,
            })
            .select('id, status')
            .single();

        if (!error && data) {
            return {
                eventId: data.id as string,
                status: data.status as string,
                wasDuplicate: false,
            };
        }

        if (error?.code === '23505') {
            const duplicate = await this.#findDuplicateEvent({ requestId, transactionId });
            return {
                eventId: duplicate.id,
                status: duplicate.status,
                wasDuplicate: true,
            };
        }

        throw new AppError('Unable to save Nomba webhook event.', 500, {
            database: error?.message ?? 'The database request failed.',
        });
    }

    async #findDuplicateEvent({
        requestId,
        transactionId,
    }: {
    requestId: string | null;
    transactionId: string | null;
  }): Promise<WebhookEventRow> {
        let query = supabase
            .from('nomba_webhook_events')
            .select('*');

        if (requestId) {
            query = query.eq('request_id', requestId);
        } else if (transactionId) {
            query = query.eq('transaction_id', transactionId);
        } else {
            throw new AppError('Duplicate webhook event could not be identified.', 409);
        }

        const { data, error } = await query.single();

        if (error || !data) {
            throw new AppError('Duplicate webhook event could not be loaded.', 500);
        }

        return data as WebhookEventRow;
    }

    async #getWebhookEvent(eventId: string): Promise<WebhookEventRow> {
        const { data, error } = await supabase
            .from('nomba_webhook_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error || !data) {
            throw new Error('Webhook event was not found.');
        }

        return data as WebhookEventRow;
    }

    async #buildConfirmedPayment(event: WebhookEventRow): Promise<ConfirmedPayment> {
        if (event.event_type !== 'payment_success') {
            throw new Error(`Unsupported Nomba webhook event type: ${event.event_type ?? 'unknown'}`);
        }

        if (!event.transaction_id) {
            throw new Error('Webhook event does not include a transaction ID.');
        }

        if (!event.account_number) {
            throw new Error('Webhook event does not include a virtual account number.');
        }

        const verifiedTransaction = await this.#verifyTransaction(event.transaction_id);

        if (verifiedTransaction.status !== 'SUCCESS') {
            throw new Error(`Nomba transaction is not successful: ${verifiedTransaction.status ?? 'unknown'}`);
        }

        const virtualAccount = await this.#findVirtualAccount(event.account_number);
        const payloadTransaction = event.payload.data?.transaction;

        return {
            provider: 'nomba',
            eventId: event.request_id ?? event.id,
            transactionId: event.transaction_id,
            userId: virtualAccount.internal_user_id,
            accountNumber: virtualAccount.bank_account_number,
            amount: this.#normalizeAmount(payloadTransaction?.transactionAmount ?? verifiedTransaction.amount),
            currency: payloadTransaction?.currency
        ?? event.payload.data?.order?.currency
        ?? verifiedTransaction.currency
        ?? verifiedTransaction.walletCurrency
        ?? 'NGN',
            paidAt: payloadTransaction?.time
        ?? verifiedTransaction.timeCreated
        ?? new Date().toISOString(),
        };
    }

    async #verifyTransaction(transactionId: string): Promise<NonNullable<TransactionVerificationResponse['data']>> {
        const accessToken = await this.nombaAuthService.getAccessToken();
        const url = new URL(`${env.nomba.baseUrl}/v1/transactions/accounts/single`);
        url.searchParams.set('transactionRef', transactionId);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                accountId: env.nomba.parentAccountId,
            },
        });

        const payload = await response.json().catch(() => null) as TransactionVerificationResponse | null;

        if (!response.ok || payload?.code !== '00' || !payload.data) {
            throw new Error(payload?.description ?? 'Unable to verify Nomba transaction.');
        }

        return payload.data;
    }

    async #findVirtualAccount(accountNumber: string): Promise<VirtualAccountLookupRow> {
        const { data, error } = await supabase
            .from('virtual_accounts')
            .select('internal_user_id, bank_account_number')
            .eq('bank_account_number', accountNumber)
            .single();

        if (error || !data) {
            throw new Error('No PayMeter user found for the webhook virtual account number.');
        }

        return data as VirtualAccountLookupRow;
    }

    async #markAttemptStarted(eventId: string, attempt: number): Promise<void> {
        await supabase
            .from('nomba_webhook_events')
            .update({
                status: 'processing',
                attempt_count: attempt,
                updated_at: new Date().toISOString(),
            })
            .eq('id', eventId);
    }

    async #recordProcessingError(eventId: string, attempt: number, message: string): Promise<void> {
        await supabase
            .from('nomba_webhook_events')
            .update({
                status: 'retrying',
                attempt_count: attempt,
                last_error: message,
                updated_at: new Date().toISOString(),
            })
            .eq('id', eventId);
    }

    async #moveToFailedEvents(eventId: string, reason: string): Promise<void> {
        const event = await this.#getWebhookEvent(eventId);

        await supabase
            .from('nomba_webhook_events')
            .update({
                status: 'failed',
                last_error: reason,
                updated_at: new Date().toISOString(),
            })
            .eq('id', eventId);

        await supabase
            .from('failed_webhook_events')
            .insert({
                webhook_event_id: eventId,
                reason,
                payload: event.payload,
            });
    }

    #processInBackground(eventId: string): void {
        setImmediate(() => {
            this.processEvent(eventId).catch((error) => {
                const message = error instanceof Error ? error.message : 'Unknown webhook processing error';
                console.error(`Nomba webhook processing failed for ${eventId}: ${message}`);
            });
        });
    }

    #serializeHeaders(headers: IncomingHttpHeaders): Record<string, string | string[]> {
        return Object.fromEntries(
            Object.entries(headers)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => [key, Array.isArray(value) ? value : String(value)]),
        );
    }

    #getHeader(headers: IncomingHttpHeaders, key: string): string | null {
        const value = headers[key.toLowerCase()];

        if (Array.isArray(value)) {
            return value[0] ?? null;
        }

        return value ?? null;
    }

    #normalizeAmount(value: number | string | undefined | null): number {
        const amount = Number(value);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('Nomba webhook transaction amount must be greater than zero.');
        }

        return amount;
    }

    #normalizeAmountForStorage(value: number | string | undefined | null): number | null {
        const amount = Number(value);

        if (!Number.isFinite(amount) || amount <= 0) {
            return null;
        }

        return amount;
    }

    #delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
