import { createFeature as mockCreateFeature, registerDemoUser as mockRegisterDemoUser } from "@/lib/mock-api";
import type { BillableFeature, DemoUser } from "@/lib/types";
import type {
  ApiEnvelope,
  CreateFeatureRequest,
  MeterRequest,
  MeterResponse,
  RegisterDemoUserRequest,
  UpdateFeatureRequest,
} from "./contracts";
import { getApiBaseUrl } from "./contracts";

const wait = (duration = 420) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error("No API base URL configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload.data;
}

export async function createBillableFeature(input: CreateFeatureRequest) {
  if (!getApiBaseUrl()) {
    return mockCreateFeature(input);
  }

  return request<BillableFeature>("/api/founders/features", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBillableFeature(featureId: string, input: UpdateFeatureRequest) {
  if (!getApiBaseUrl()) {
    return null;
  }

  return request<BillableFeature>(`/api/founders/features/${featureId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function registerEndUser(input: RegisterDemoUserRequest) {
  if (!getApiBaseUrl()) {
    return mockRegisterDemoUser(input);
  }

  return request<DemoUser>("/api/demo/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function meterFeatureUse(
  input: MeterRequest,
  mockContext: {
    balance: number;
    featureName: string;
    featurePrice: number;
  },
) {
  if (!getApiBaseUrl()) {
    await wait(520);

    if (mockContext.balance < mockContext.featurePrice) {
      return {
        allowed: false,
        balance: mockContext.balance,
        chargedAmount: 0,
        message: "Insufficient balance. Please top up before using this feature.",
        usageEvent: {
          id: input.idempotencyKey,
          featureName: mockContext.featureName,
          amount: mockContext.featurePrice,
          status: "denied",
          createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
        },
      } satisfies MeterResponse;
    }

    return {
      allowed: true,
      balance: mockContext.balance - mockContext.featurePrice,
      chargedAmount: mockContext.featurePrice,
      message: "Allowed. Balance was deducted atomically.",
      usageEvent: {
        id: input.idempotencyKey,
        featureName: mockContext.featureName,
        amount: mockContext.featurePrice,
        status: "allowed",
        createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
      },
    } satisfies MeterResponse;
  }

  return request<MeterResponse>("/api/meter", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
