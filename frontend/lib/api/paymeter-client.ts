import { createFeature as mockCreateFeature, registerDemoUser as mockRegisterDemoUser } from "@/lib/mock-api";
import type { BillableFeature, DemoUser, Founder } from "@/lib/types";
import type {
  ApiEnvelope,
  BackendAnalyticsResponse,
  BackendFeature,
  CreateFeatureRequest,
  FounderAuthRequest,
  FounderAuthResponse,
  FounderRegisterRequest,
  MeterRequest,
  MeterResponse,
  RegisterDemoUserRequest,
  UpdateFeatureRequest,
} from "./contracts";
import { getApiBaseUrl } from "./contracts";

const REQUEST_TIMEOUT_MS = 45000;

const wait = (duration = 420) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error("No API base URL configured.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (init?.token) {
    headers.Authorization = `Bearer ${init.token}`;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Live backend is taking too long to respond. It may still be waking up, so wait a moment and try again.");
    }

    throw new Error("Could not reach the live backend. Check the backend URL or try again once the service is online.");
  } finally {
    window.clearTimeout(timeoutId);
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!payload) {
    throw new Error("Backend returned an invalid response.");
  }

  if (!response.ok || !payload.success) {
    const fieldErrors =
      payload && "errors" in payload && payload.errors && typeof payload.errors === "object"
        ? Object.values(payload.errors as Record<string, unknown>)
            .filter((value) => typeof value === "string")
            .join(" ")
        : "";

    throw new Error(fieldErrors || payload.message || "Request failed.");
  }

  return payload.data;
}

function mapFeature(feature: BackendFeature, usageCount = 0): BillableFeature {
  return {
    id: feature.id,
    name: feature.name,
    price: Number(feature.price),
    active: feature.isActive,
    usageCount,
  };
}

export async function registerFounder(input: FounderRegisterRequest) {
  if (!getApiBaseUrl()) {
    return {
      founder: {
        id: "founder_mock_tunde",
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
      },
      token: "mock-founder-token",
    } satisfies FounderAuthResponse;
  }

  return request<FounderAuthResponse>("/api/founders/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginFounder(input: FounderAuthRequest) {
  if (!getApiBaseUrl()) {
    return {
      founder: {
        id: "founder_mock_tunde",
        name: "Tunde Founder",
        email: input.email.trim().toLowerCase(),
      },
      token: "mock-founder-token",
    } satisfies FounderAuthResponse;
  }

  return request<FounderAuthResponse>("/api/founders/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listBillableFeatures(token: string | null) {
  if (!getApiBaseUrl()) {
    return null;
  }

  const features = await request<BackendFeature[]>("/api/features", {
    method: "GET",
    token,
  });

  return features.map((feature) => mapFeature(feature));
}

export async function getFounderAnalytics(token: string | null) {
  if (!getApiBaseUrl()) {
    return null;
  }

  const analytics = await request<BackendAnalyticsResponse>("/api/founders/analytics", {
    method: "GET",
    token,
  });

  return {
    totalRevenue: Number(analytics.totalRevenue),
    activeUsers: analytics.activeUsersCount,
    features: analytics.featuresBreakdown.map((feature) =>
      mapFeature(
        {
          id: feature.id,
          name: feature.name,
          price: feature.price,
          isActive: feature.isActive,
        },
        feature.useCount,
      ),
    ),
  };
}

export async function createBillableFeature(input: CreateFeatureRequest, token?: string | null) {
  if (!getApiBaseUrl()) {
    return mockCreateFeature(input);
  }

  const feature = await request<BackendFeature>("/api/features", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });

  return mapFeature(feature);
}

export async function updateBillableFeature(featureId: string, input: UpdateFeatureRequest, token?: string | null) {
  if (!getApiBaseUrl()) {
    return null;
  }

  const feature = await request<BackendFeature>(`/api/features/${featureId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  });

  return mapFeature(feature);
}

export async function toggleBillableFeature(featureId: string, token?: string | null) {
  if (!getApiBaseUrl()) {
    return null;
  }

  const feature = await request<BackendFeature>(`/api/features/${featureId}/toggle`, {
    method: "PATCH",
    token,
  });

  return mapFeature(feature);
}

export async function registerEndUser(input: RegisterDemoUserRequest) {
  if (!getApiBaseUrl()) {
    return mockRegisterDemoUser(input);
  }

  const userId = input.userId ?? `captionpilot_${input.email.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`;

  const account = await request<{
    userId: string;
    name: string;
    email: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
  }>("/api/nomba/virtual-accounts", {
    method: "POST",
    body: JSON.stringify({
      userId,
      name: input.name,
      email: input.email,
      companyName: input.companyName ?? "CaptionPilot",
      phoneNumber: input.phoneNumber,
    }),
  });

  return {
    id: account.userId,
    name: account.name,
    email: account.email,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    bankName: account.bankName,
  } satisfies DemoUser;
}

export async function fetchEndUserBalance(userId: string) {
  if (!getApiBaseUrl()) {
    return null;
  }

  return request<{
    userId: string;
    balance: number;
    accountInfo: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      name: string;
      email: string;
    } | null;
    usageHistory: Array<{
      id: string;
      amount: number;
      createdAt: string;
      featureName: string;
    }>;
    fundingHistory: Array<{
      id: string;
      amount: number;
      createdAt: string;
    }>;
  }>(`/api/users/${userId}/balance`, {
    method: "GET",
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
          id: `meter_denied_${Date.now()}`,
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
        id: `meter_allowed_${Date.now()}`,
        featureName: mockContext.featureName,
        amount: mockContext.featurePrice,
        status: "allowed",
        createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
      },
    } satisfies MeterResponse;
  }

  const result = await request<{
    allowed: boolean;
    deductedAmount?: number;
    chargedAmount?: number;
    remainingBalance?: number;
    balance?: number;
    message?: string;
  }>("/api/meter", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const chargedAmount = result.deductedAmount ?? result.chargedAmount ?? 0;
  const remainingBalance = result.remainingBalance ?? result.balance ?? mockContext.balance;

  return {
    allowed: result.allowed,
    balance: remainingBalance,
    chargedAmount,
    message: result.message ?? (result.allowed ? "Meter check allowed and balance deducted." : "Insufficient balance."),
    usageEvent: {
      id: `meter_${Date.now()}`,
      featureName: input.featureName,
      amount: result.allowed ? chargedAmount : mockContext.featurePrice,
      status: result.allowed ? "allowed" : "denied",
      createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
    },
  } satisfies MeterResponse;
}

export type StudioSession = {
  founder: Founder;
  token: string;
};
