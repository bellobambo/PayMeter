import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { NombaMoneyService } from './NombaMoneyService.js';

import type { Bank, TransferResponse } from './NombaMoneyService.js';

type SettlementAccountRow = {
  id: string;
  founder_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
};

type PayoutRow = {
  id: string;
  founder_id: string;
  amount: number | string;
  status: 'reserved' | 'processing' | 'paid' | 'failed' | 'cancelled';
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  merchant_tx_ref: string;
  transfer_reference: string | null;
  transfer_status: string | null;
  nomba_response: TransferResponse | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
};

type SettlementSummary = {
  totalRevenue: number;
  availableBalance: number;
  pendingPayouts: number;
  paidOut: number;
};

type ReservePayoutResult = {
  success: boolean;
  reason?: string;
  payoutId?: string;
  availableBalance?: number;
  availableBefore?: number;
  availableAfter?: number;
  settlementAccount?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
};

type FounderIdentity = {
  id: string;
  name: string;
};

export class FounderSettlementService {
    nombaMoneyService: NombaMoneyService;

    constructor() {
        this.nombaMoneyService = new NombaMoneyService();
    }

    async getSummary(founderId: string): Promise<SettlementSummary> {
        const { data, error } = await supabase.rpc('get_founder_settlement_summary', {
            p_founder_id: founderId,
        });

        if (error) {
            throw new AppError('Unable to load settlement summary.', 500, {
                database: error.message,
            });
        }

        const summary = data as Partial<SettlementSummary> | null;

        return {
            totalRevenue: Number(summary?.totalRevenue ?? 0),
            availableBalance: Number(summary?.availableBalance ?? 0),
            pendingPayouts: Number(summary?.pendingPayouts ?? 0),
            paidOut: Number(summary?.paidOut ?? 0),
        };
    }

    async listBanks(): Promise<Bank[]> {
        return this.nombaMoneyService.listBanks();
    }

    async getSettlementAccount(founderId: string) {
        const { data, error } = await supabase
            .from('founder_settlement_accounts')
            .select('*')
            .eq('founder_id', founderId)
            .maybeSingle();

        if (error) {
            this.#throwMissingMigrationError(error, 'Unable to load settlement account.');
        }

        return data ? this.#mapSettlementAccount(data as SettlementAccountRow) : null;
    }

    async verifySettlementAccount({
        founderId,
        accountNumber,
        bankCode,
        bankName,
    }: {
    founderId: string;
    accountNumber: string;
    bankCode: string;
    bankName: string;
  }) {
        const lookup = await this.nombaMoneyService.lookupBankAccount({
            accountNumber,
            bankCode,
        });

        const { data, error } = await supabase
            .from('founder_settlement_accounts')
            .upsert(
                {
                    founder_id: founderId,
                    bank_code: bankCode,
                    bank_name: bankName,
                    account_number: lookup.accountNumber,
                    account_name: lookup.accountName,
                    verified_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'founder_id',
                },
            )
            .select('*')
            .single();

        if (error || !data) {
            this.#throwMissingMigrationError(error, 'Unable to save settlement account.');
        }

        return this.#mapSettlementAccount(data as SettlementAccountRow);
    }

    async listPayouts(founderId: string) {
        const { data, error } = await supabase
            .from('founder_payout_requests')
            .select('*')
            .eq('founder_id', founderId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            this.#throwMissingMigrationError(error, 'Unable to load payout history.');
        }

        return (data ?? []).map((row) => this.#mapPayout(row as PayoutRow));
    }

    async requestPayout({
        founder,
        amount,
    }: {
    founder: FounderIdentity;
    amount: number;
  }) {
        const merchantTxRef = this.#createMerchantTxRef(founder.id);

        const { data, error } = await supabase.rpc('reserve_founder_payout', {
            p_founder_id: founder.id,
            p_amount: amount,
            p_merchant_tx_ref: merchantTxRef,
        });

        if (error) {
            throw new AppError('Unable to reserve payout.', 500, {
                database: error.message,
            });
        }

        const reserve = data as ReservePayoutResult | null;

        if (!reserve?.success || !reserve.payoutId || !reserve.settlementAccount) {
            throw new AppError(reserve?.reason ?? 'Unable to reserve payout.', 422, {
                availableBalance: reserve?.availableBalance,
            });
        }

        try {
            const transfer = await this.nombaMoneyService.initiateBankTransfer({
                amount,
                accountNumber: reserve.settlementAccount.accountNumber,
                accountName: reserve.settlementAccount.accountName,
                bankCode: reserve.settlementAccount.bankCode,
                merchantTxRef,
                senderName: 'PayMeter',
                narration: `PayMeter settlement for ${founder.name}`,
            });

            const nextStatus = this.#mapTransferStatus(transfer.status);

            await this.#updatePayoutTransfer({
                payoutId: reserve.payoutId,
                status: nextStatus,
                transfer,
            });

            return {
                payout: await this.#getPayoutOrThrow(reserve.payoutId),
                availableAfter: Number(reserve.availableAfter ?? 0),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Transfer request failed.';
            await this.#markPayoutFailed(reserve.payoutId, message);
            throw error;
        }
    }

    async #getPayoutOrThrow(payoutId: string) {
        const { data, error } = await supabase
            .from('founder_payout_requests')
            .select('*')
            .eq('id', payoutId)
            .single();

        if (error || !data) {
            throw new AppError('Payout was created but could not be loaded.', 500);
        }

        return this.#mapPayout(data as PayoutRow);
    }

    async #updatePayoutTransfer({
        payoutId,
        status,
        transfer,
    }: {
    payoutId: string;
    status: PayoutRow['status'];
    transfer: TransferResponse;
  }) {
        const { error } = await supabase
            .from('founder_payout_requests')
            .update({
                status,
                transfer_reference: this.#extractTransferReference(transfer),
                transfer_status: transfer.status ?? null,
                nomba_response: transfer,
                paid_at: status === 'paid' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', payoutId);

        if (error) {
            throw new AppError('Unable to update payout status.', 500, {
                database: error.message,
            });
        }
    }

    async #markPayoutFailed(payoutId: string, reason: string) {
        await supabase
            .from('founder_payout_requests')
            .update({
                status: 'failed',
                failure_reason: reason,
                updated_at: new Date().toISOString(),
            })
            .eq('id', payoutId);
    }

    #mapTransferStatus(status?: string): PayoutRow['status'] {
        const normalized = status?.toUpperCase();

        if (normalized && ['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID'].includes(normalized)) {
            return 'paid';
        }

        return 'processing';
    }

    #extractTransferReference(transfer: TransferResponse): string | null {
        const candidate = transfer.id ?? transfer.transactionId ?? transfer.transactionRef ?? transfer.reference;
        return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : null;
    }

    #createMerchantTxRef(founderId: string) {
        return `paymeter_payout_${founderId.replace(/-/g, '').slice(0, 12)}_${Date.now()}`;
    }

    #mapSettlementAccount(row: SettlementAccountRow) {
        return {
            id: row.id,
            founderId: row.founder_id,
            bankCode: row.bank_code,
            bankName: row.bank_name,
            accountNumber: row.account_number,
            accountName: row.account_name,
            verifiedAt: row.verified_at,
            updatedAt: row.updated_at,
        };
    }

    #mapPayout(row: PayoutRow) {
        return {
            id: row.id,
            amount: Number(row.amount),
            status: row.status,
            bankCode: row.bank_code,
            bankName: row.bank_name,
            accountNumber: row.account_number,
            accountName: row.account_name,
            merchantTxRef: row.merchant_tx_ref,
            transferReference: row.transfer_reference,
            transferStatus: row.transfer_status,
            failureReason: row.failure_reason,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            paidAt: row.paid_at,
        };
    }

    #throwMissingMigrationError(error: { code?: string; message?: string } | null, fallback: string): never {
        if (
            error?.code === '42P01'
      || error?.code === 'PGRST205'
      || Boolean(error?.message?.includes('founder_settlement_accounts'))
      || Boolean(error?.message?.includes('founder_payout_requests'))
        ) {
            throw new AppError('Settlement tables are not available. Run backend/supabase/migrations/005_founder_settlements.sql.', 500, {
                database: error?.message ?? 'Missing settlement migration.',
            });
        }

        throw new AppError(fallback, 500, {
            database: error?.message ?? 'The database request failed.',
        });
    }
}
