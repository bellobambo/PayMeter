import type { BillableFeature, DemoUser, Founder, UsageEvent } from "@/lib/types";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CreateFeatureRequest = {
  name: string;
  price: number;
};

export type UpdateFeatureRequest = CreateFeatureRequest;

export type FounderAuthRequest = {
  email: string;
  password: string;
};

export type FounderRegisterRequest = FounderAuthRequest & {
  name: string;
};

export type FounderAuthResponse = {
  founder: Founder;
  token: string;
};

export type BackendFeature = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendAnalyticsResponse = {
  totalRevenue: number;
  activeUsersCount: number;
  featuresBreakdown: Array<{
    id: string;
    name: string;
    price: number;
    isActive: boolean;
    useCount: number;
    revenue: number;
  }>;
};

export type SettlementBank = {
  name: string;
  code: string;
  nipCode?: string | null;
  logo?: string;
};

export type SettlementAccount = {
  id: string;
  founderId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verifiedAt: string;
  updatedAt: string;
};

export type SettlementPayout = {
  id: string;
  amount: number;
  status: "reserved" | "processing" | "paid" | "failed" | "cancelled";
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  merchantTxRef: string;
  transferReference: string | null;
  transferStatus: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};

export type SettlementSummaryResponse = {
  summary: {
    totalRevenue: number;
    availableBalance: number;
    pendingPayouts: number;
    paidOut: number;
  };
  settlementAccount: SettlementAccount | null;
  recentPayouts: SettlementPayout[];
};

export type VerifySettlementAccountRequest = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
};

export type CreatePayoutRequest = {
  amount: number;
};

export type RegisterDemoUserRequest = {
  userId?: string;
  name: string;
  email: string;
  companyName?: string;
  phoneNumber?: string;
};

export type MeterRequest = {
  userId: string;
  featureName: string;
  founderId?: string;
};

export type MeterResponse = {
  allowed: boolean;
  balance: number;
  chargedAmount: number;
  message: string;
  usageEvent?: UsageEvent;
};

export type BalanceResponse = {
  userId: string;
  balance: number;
  recentUsage: UsageEvent[];
};

export type DashboardAnalyticsResponse = {
  totalRevenue: number;
  activeUsers: number;
  features: BillableFeature[];
};

export const taskTwoContracts = [
  {
    method: "POST",
    path: "/api/founders/register",
    owner: "PayMeter backend",
    purpose: "Create a PayMeter Studio founder workspace and return a secure session.",
  },
  {
    method: "POST",
    path: "/api/founders/login",
    owner: "PayMeter backend",
    purpose: "Authenticate a founder and restore their Studio session.",
  },
  {
    method: "POST",
    path: "/api/features",
    owner: "PayMeter backend",
    purpose: "Create a billable feature with a price per use.",
  },
  {
    method: "PUT",
    path: "/api/features/:id",
    owner: "PayMeter backend",
    purpose: "Rename or reprice an existing feature.",
  },
  {
    method: "PATCH",
    path: "/api/features/:id/toggle",
    owner: "PayMeter backend",
    purpose: "Activate or deactivate a feature without deleting usage history.",
  },
  {
    method: "GET",
    path: "/api/founders/analytics",
    owner: "PayMeter backend",
    purpose: "Return revenue, active users, and per-feature usage.",
  },
  {
    method: "GET",
    path: "/api/founders/settlement/summary",
    owner: "PayMeter backend",
    purpose: "Return founder revenue available for withdrawal, pending payouts, paid payouts, and settlement account.",
  },
  {
    method: "POST",
    path: "/api/founders/settlement/account/verify",
    owner: "PayMeter backend",
    purpose: "Verify and save the founder bank account used for withdrawals.",
  },
  {
    method: "POST",
    path: "/api/founders/settlement/payouts",
    owner: "PayMeter backend",
    purpose: "Reserve founder revenue and initiate a bank payout.",
  },
  {
    method: "POST",
    path: "/api/nomba/virtual-accounts",
    owner: "Payment backend",
    purpose: "Register an end user, initialize balance, and return their Nomba virtual account.",
  },
  {
    method: "POST",
    path: "/api/meter",
    owner: "PayMeter backend",
    purpose: "Atomically allow or deny a billable action before it runs.",
  },
] as const;

export function getApiMode() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ? "Live backend" : "Preview mode";
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
}

export type RegisterDemoUserResponse = DemoUser;
