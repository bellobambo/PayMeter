import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { retry } from '../utils/retry.js';
import { AppError } from '../utils/AppError.js';
import { NombaAuthService } from './NombaAuthService.js';

type Nullable<T> = T | null;

type CreateVirtualAccountInput = {
  internalUserId: string;
  name: string;
  email: string;
  companyName?: Nullable<string>;
  phoneNumber?: Nullable<string>;
};

type UserRow = {
  id: string;
  internal_user_id: string;
  name: string;
  email: string;
  company_name: Nullable<string>;
  phone_number: Nullable<string>;
};

type VirtualAccountRow = {
  internal_user_id: string;
  account_ref: string;
  account_name: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: Nullable<string>;
  currency: string;
  users?: UserRow | null;
};

type MappedVirtualAccount = {
  internalUserId: string;
  name: string;
  email: Nullable<string>;
  companyName: Nullable<string>;
  phoneNumber: Nullable<string>;
  accountRef: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: Nullable<string>;
  currency: string;
};

type CreatedVirtualAccount = MappedVirtualAccount & {
  wasExisting: boolean;
};

type NombaVirtualAccountPayload = {
  accountRef?: string;
  accountHolderId?: string;
  accountName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  accountNumber?: string;
  bankAccountName?: string;
  currency?: string;
};

type NombaVirtualAccountResponse = {
  code?: string;
  description?: string;
  data?: NombaVirtualAccountPayload;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
};

export class NombaVirtualAccountService {
  nombaAuthService: NombaAuthService;

  constructor() {
    this.nombaAuthService = new NombaAuthService();
  }

  async createForUser({
    internalUserId,
    name,
    email,
    companyName,
    phoneNumber,
  }: CreateVirtualAccountInput): Promise<CreatedVirtualAccount> {
    this.#validateCreateInput({ internalUserId, name, email });

    const existingAccount = await this.#findExistingVirtualAccount(internalUserId);
    if (existingAccount) {
      return {
        ...this.#mapVirtualAccountRow(existingAccount),
        wasExisting: true,
      };
    }

    const user = await this.#upsertUser({
      internalUserId,
      name,
      email,
      companyName,
      phoneNumber,
    });
    const accountRef = `paymeter_user_${internalUserId}`;

    const nombaAccount = await retry(
      () => this.#createNombaVirtualAccount({ accountRef, accountName: name }),
      {
        retries: 1,
        delayMs: 500,
      },
    );

    const row = await this.#saveVirtualAccount({
      userId: user.id,
      internalUserId,
      accountRef,
      accountName: name,
      nombaAccount,
    });

    return {
      ...this.#mapVirtualAccountRow({
        ...row,
        users: user,
      }),
      wasExisting: false,
    };
  }

  async getForUser(internalUserId: string): Promise<MappedVirtualAccount> {
    if (!internalUserId || typeof internalUserId !== 'string' || !internalUserId.trim()) {
      throw new AppError('userId is required', 400);
    }

    const account = await this.#findExistingVirtualAccount(internalUserId);

    if (!account) {
      throw new AppError('Virtual account not found for this user.', 404, {
        userId: 'No virtual account exists for the supplied userId.',
      });
    }

    return this.#mapVirtualAccountRow(account);
  }

  #validateCreateInput({ internalUserId, name, email }: CreateVirtualAccountInput): void {
    if (!internalUserId || typeof internalUserId !== 'string' || !internalUserId.trim()) {
      throw new AppError('userId is required', 400);
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('name is required', 400);
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new AppError('email is required', 400);
    }
  }

  async #findExistingVirtualAccount(internalUserId: string): Promise<VirtualAccountRow | null> {
    const { data, error } = await supabase
      .from('virtual_accounts')
      .select('*, users!inner(email, name, company_name, phone_number)')
      .eq('internal_user_id', internalUserId)
      .maybeSingle();

    if (error) {
      this.#throwSupabaseError('check existing virtual account', error);
    }

    return data as VirtualAccountRow | null;
  }

  async #upsertUser({
    internalUserId,
    name,
    email,
    companyName,
    phoneNumber,
  }: CreateVirtualAccountInput): Promise<UserRow> {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          internal_user_id: internalUserId,
          name,
          email,
          company_name: companyName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'internal_user_id',
        },
      )
      .select('*')
      .single();

    if (error) {
      this.#throwSupabaseError('save user', error);
    }

    return data as UserRow;
  }

  async #createNombaVirtualAccount({
    accountRef,
    accountName,
  }: {
    accountRef: string;
    accountName: string;
  }): Promise<NombaVirtualAccountPayload> {
    const accessToken = await this.nombaAuthService.getAccessToken();

    const response = await fetch(
      `${env.nomba.baseUrl}/v1/accounts/virtual/${env.nomba.subAccountId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          accountId: env.nomba.parentAccountId,
        },
        body: JSON.stringify({
          accountRef,
          accountName,
          currency: 'NGN',
        }),
      },
    );

    const payload = await response.json().catch(() => null) as NombaVirtualAccountResponse | null;

    if (!response.ok || payload?.code !== '00' || !payload?.data) {
      throw new AppError(
        'Unable to create virtual account with Nomba. Please try again.',
        502,
        {
          nomba: payload?.description ?? 'Nomba virtual account request failed.',
        },
      );
    }

    return payload.data;
  }

  async #saveVirtualAccount({
    userId,
    internalUserId,
    accountRef,
    accountName,
    nombaAccount,
  }: {
    userId: string;
    internalUserId: string;
    accountRef: string;
    accountName: string;
    nombaAccount: NombaVirtualAccountPayload;
  }): Promise<VirtualAccountRow> {
    const bankAccountNumber =
      nombaAccount.bankAccountNumber ?? nombaAccount.accountNumber;

    if (!bankAccountNumber || !nombaAccount.bankName) {
      throw new Error('Nomba response did not include account number or bank name');
    }

    const { data, error } = await supabase
      .from('virtual_accounts')
      .insert({
        user_id: userId,
        internal_user_id: internalUserId,
        account_ref: nombaAccount.accountRef ?? accountRef,
        account_holder_id: nombaAccount.accountHolderId ?? null,
        account_name: nombaAccount.accountName ?? accountName,
        bank_name: nombaAccount.bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: nombaAccount.bankAccountName ?? null,
        currency: nombaAccount.currency ?? 'NGN',
        nomba_response: nombaAccount,
      })
      .select('*')
      .single();

    if (error) {
      this.#throwSupabaseError('save virtual account', error);
    }

    return data as VirtualAccountRow;
  }

  #throwSupabaseError(action: string, error: SupabaseErrorLike): never {
    if (this.#isDuplicatePhoneNumberError(error)) {
      throw new AppError(
        'Phone number already belongs to another user.',
        409,
        {
          phoneNumber: 'This phone number has already been used by another user.',
        },
      );
    }

    if (this.#isMissingSupabaseSchemaError(error)) {
      throw new AppError(
        'Database schema is not up to date. Run the Supabase migration, then try again.',
        500,
        {
          database:
            'Missing required PayMeter tables or columns. Run backend/supabase/migrations/001_add_user_email.sql, or re-run backend/supabase/schema.sql for a fresh setup.',
        },
      );
    }

    throw new AppError(
      `Unable to ${action}. Please try again.`,
      500,
      {
        database: 'The database request failed.',
      },
    );
  }

  #isDuplicatePhoneNumberError(error: SupabaseErrorLike): boolean {
    return error?.code === '23505'
      && (
        Boolean(error.message?.includes('users_phone_number_unique'))
        || Boolean(error.details?.includes('phone_number'))
      );
  }

  #isMissingSupabaseSchemaError(error: SupabaseErrorLike): boolean {
    return error?.code === 'PGRST205'
      || error?.code === '42703'
      || Boolean(error.message?.includes('Could not find the table'))
      || Boolean(error.message?.includes('does not exist'))
      || Boolean(error.message?.includes('Could not find'))
      || Boolean(error.message?.includes('column'));
  }

  #mapVirtualAccountRow(row: VirtualAccountRow): MappedVirtualAccount {
    return {
      internalUserId: row.internal_user_id,
      name: row.users?.name ?? row.account_name,
      email: row.users?.email ?? null,
      companyName: row.users?.company_name ?? null,
      phoneNumber: row.users?.phone_number ?? null,
      accountRef: row.account_ref,
      bankName: row.bank_name,
      bankAccountNumber: row.bank_account_number,
      bankAccountName: row.bank_account_name,
      currency: row.currency,
    };
  }

}
