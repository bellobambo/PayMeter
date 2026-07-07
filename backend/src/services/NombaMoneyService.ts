import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { NombaAuthService } from './NombaAuthService.js';

type NombaResponse<TData> = {
  code?: string;
  description?: string;
  message?: string;
  status?: boolean;
  data?: TData;
};

type Balance = {
  amount: string;
  currency: string;
  timeCreated?: string;
};

export type Bank = {
  name: string;
  code: string;
  nipCode?: string | null;
  logo?: string;
};

export type BankLookup = {
  accountNumber: string;
  accountName: string;
};

type BankTransferInput = {
  amount: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  merchantTxRef: string;
  senderName?: string | null;
  narration?: string | null;
  subAccountId?: string | null;
};

type WalletTransferInput = {
  amount: number;
  receiverAccountId: string;
  merchantTxRef: string;
  senderName?: string | null;
  narration?: string | null;
  subAccountId?: string | null;
};

export type TransferResponse = {
  id?: string;
  status?: string;
  type?: string;
  amount?: number | string;
  fee?: number;
  timeCreated?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

export class NombaMoneyService {
    nombaAuthService: NombaAuthService;

    constructor() {
        this.nombaAuthService = new NombaAuthService();
    }

    async getBalance(subAccountId?: string | null): Promise<Balance> {
        const path = subAccountId
            ? `/v1/accounts/${encodeURIComponent(subAccountId)}/balance`
            : '/v1/accounts/balance';

        return this.#request<Balance>(path, {
            errorMessage: 'Unable to fetch Nomba account balance.',
        });
    }

    async listBanks(): Promise<Bank[]> {
        return this.#request<Bank[]>('/v1/transfers/bank', {
            errorMessage: 'Unable to fetch Nomba banks.',
        });
    }

    async lookupBankAccount({
        accountNumber,
        bankCode,
    }: {
    accountNumber: string;
    bankCode: string;
  }): Promise<BankLookup> {
        return this.#request<BankLookup>('/v1/transfers/bank/lookup', {
            method: 'POST',
            body: {
                accountNumber,
                bankCode,
            },
            errorMessage: 'Unable to verify recipient bank account.',
        });
    }

    async initiateBankTransfer(input: BankTransferInput): Promise<TransferResponse> {
        const path = input.subAccountId
            ? `/v2/transfers/bank/${encodeURIComponent(input.subAccountId)}`
            : '/v2/transfers/bank';

        return this.#request<TransferResponse>(path, {
            method: 'POST',
            body: this.#compactBody({
                amount: input.amount,
                accountNumber: input.accountNumber,
                accountName: input.accountName,
                bankCode: input.bankCode,
                merchantTxRef: input.merchantTxRef,
                senderName: input.senderName,
                narration: input.narration,
            }),
            errorMessage: 'Unable to initiate Nomba bank transfer.',
        });
    }

    async initiateWalletTransfer(input: WalletTransferInput): Promise<TransferResponse> {
        const path = input.subAccountId
            ? `/v2/transfers/wallet/${encodeURIComponent(input.subAccountId)}`
            : '/v2/transfers/wallet';

        return this.#request<TransferResponse>(path, {
            method: 'POST',
            body: this.#compactBody({
                amount: input.amount,
                receiverAccountId: input.receiverAccountId,
                merchantTxRef: input.merchantTxRef,
                senderName: input.senderName,
                narration: input.narration,
            }),
            errorMessage: 'Unable to initiate Nomba wallet transfer.',
        });
    }

    async #request<TData>(
        path: string,
        {
            method = 'GET',
            body,
            errorMessage,
        }: {
      method?: 'GET' | 'POST';
      body?: Record<string, unknown>;
      errorMessage: string;
    },
    ): Promise<TData> {
        const accessToken = await this.nombaAuthService.getAccessToken();

        const response = await fetch(`${env.nomba.baseUrl}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                accountId: env.nomba.parentAccountId,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const payload = await response.json().catch(() => null) as NombaResponse<TData> | null;

        if (!response.ok || !payload?.data || this.#isNombaFailure(payload)) {
            throw new AppError(errorMessage, response.ok ? 502 : response.status, {
                nomba: payload?.description ?? payload?.message ?? 'Nomba request failed.',
            });
        }

        return payload.data;
    }

    #isNombaFailure<TData>(payload: NombaResponse<TData>): boolean {
        const code = payload.code?.toUpperCase();
        const description = payload.description?.toUpperCase();

        return Boolean(
            code
      && !['00', '200'].includes(code)
      && description !== 'SUCCESS'
      && description !== 'PROCESSING',
        );
    }

    #compactBody(body: Record<string, unknown>): Record<string, unknown> {
        return Object.fromEntries(
            Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''),
        );
    }
}
