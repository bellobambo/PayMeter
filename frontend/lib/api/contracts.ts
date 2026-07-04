import type { BillableFeature, DemoUser, UsageEvent } from "@/lib/types";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CreateFeatureRequest = {
  name: string;
  price: number;
};

export type UpdateFeatureRequest = Partial<CreateFeatureRequest> & {
  active?: boolean;
};

export type RegisterDemoUserRequest = {
  name: string;
  email: string;
};

export type MeterRequest = {
  userId: string;
  featureId: string;
  idempotencyKey: string;
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
    path: "/api/founders/features",
    owner: "Task 2",
    purpose: "Create a billable feature with a price per use.",
  },
  {
    method: "PATCH",
    path: "/api/founders/features/:featureId",
    owner: "Task 2",
    purpose: "Rename, reprice, activate, or deactivate a feature.",
  },
  {
    method: "GET",
    path: "/api/founders/analytics",
    owner: "Task 2",
    purpose: "Return revenue, active users, and per-feature usage.",
  },
  {
    method: "POST",
    path: "/api/demo/users",
    owner: "Task 2 + Task 1",
    purpose: "Register an end user and return their Nomba virtual account.",
  },
  {
    method: "POST",
    path: "/api/meter",
    owner: "Task 2",
    purpose: "Atomically allow or deny a billable action before it runs.",
  },
] as const;

export function getApiMode() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ? "Live API" : "Mock API";
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
}

export type RegisterDemoUserResponse = DemoUser;
