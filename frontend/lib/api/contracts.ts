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
