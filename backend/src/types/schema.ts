export type MeterCheckResult = {
    allowed: boolean;
    reason?: string;
    deductedAmount?: number;
    remainingBalance?: number;
    currentBalance?: number;
    featurePrice?: number;
};

export type VirtualAccountUserRow = {
    name: string;
    email: string;
};

export type VirtualAccountRow = {
    bank_name: string;
    bank_account_number: string;
    account_name: string;
    users?: VirtualAccountUserRow | null;
};

export type UsageLogRow = {
    id: string;
    amount: number | string;
    created_at: string;
    features?: {
        name?: string | null;
    } | null;
};

export type FundingHistoryRow = {
    id: string;
    amount: number | string;
    created_at: string;
};

export type AccountInfo = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    name: string;
    email: string;
} | null;