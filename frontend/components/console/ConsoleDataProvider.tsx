"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createBillableFeature,
  getFounderAnalytics,
  listBillableFeatures,
  loginFounder,
  registerFounder,
  logoutFounder,
  toggleBillableFeature,
  updateBillableFeature,
  type StudioSession,
} from "@/lib/api/paymeter-client";
import { getApiBaseUrl } from "@/lib/api/contracts";
import { formatNaira } from "@/lib/format";
import { seedFeatures } from "@/lib/mock-api";
import { SecureStorage } from "@/lib/secureStorage";
import type { BillableFeature } from "@/lib/types";

type StudioAnalytics = {
  totalRevenue: number;
  totalUsage: number;
  activeFeatures: number;
  activeUsers: number;
};

type AuthResult = {
  ok: boolean;
  message?: string;
};

type ConsoleDataContextValue = {
  founderName: string;
  session: StudioSession | null;
  isLiveMode: boolean;
  isHydrated: boolean;
  isLoadingData: boolean;
  notice: string;
  error: string;
  features: BillableFeature[];
  analytics: StudioAnalytics;
  register: (input: { name: string; email: string; password: string }) => Promise<AuthResult>;
  login: (input: { email: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshStudioData: () => Promise<void>;
  createFeature: (input: { name: string; price: number }) => Promise<void>;
  updateFeature: (featureId: string, input: { name: string; price: number }) => Promise<void>;
  toggleFeature: (featureId: string) => Promise<void>;
  setNotice: (notice: string) => void;
};

const ConsoleDataContext = createContext<ConsoleDataContextValue | null>(null);
const SESSION_KEY = "paymeter_studio_session";

export function ConsoleDataProvider({ children }: { children: React.ReactNode }) {
  const isLiveMode = Boolean(getApiBaseUrl());
  const [session, setSession] = useState<StudioSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [features, setFeatures] = useState<BillableFeature[]>(() => (isLiveMode ? [] : seedFeatures));
  const [analyticsOverride, setAnalyticsOverride] = useState<{ totalRevenue: number; activeUsers: number } | null>(null);
  const [notice, setNotice] = useState(
    isLiveMode ? "Sign in to manage live pricing and usage data." : "Preview data is loaded for the product walkthrough.",
  );
  const [error, setError] = useState("");

  const founderName = session?.founder.name ?? (isLiveMode ? "" : "Tunde");

  const analytics = useMemo<StudioAnalytics>(() => {
    const totalRevenue = features.reduce((sum, feature) => sum + feature.price * feature.usageCount, 0);
    const totalUsage = features.reduce((sum, feature) => sum + feature.usageCount, 0);
    const activeFeatures = features.filter((feature) => feature.active).length;

    return {
      totalRevenue: analyticsOverride?.totalRevenue ?? totalRevenue,
      totalUsage,
      activeFeatures,
      activeUsers: analyticsOverride?.activeUsers ?? (isLiveMode && !session ? 0 : 184),
    };
  }, [analyticsOverride, features, isLiveMode, session]);

  const persistSession = useCallback((nextSession: StudioSession) => {
    setSession(nextSession);

    if (typeof window !== "undefined") {
      SecureStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    }
  }, []);

  const refreshStudioData = useCallback(async () => {
    if (!isLiveMode || !session) {
      return;
    }

    setIsLoadingData(true);
    setError("");

    try {
      const [liveFeatures, liveAnalytics] = await Promise.all([
        listBillableFeatures(session.token ?? null),
        getFounderAnalytics(session.token ?? null),
      ]);

      if (liveAnalytics) {
        setFeatures(liveAnalytics.features);
        setAnalyticsOverride({
          totalRevenue: liveAnalytics.totalRevenue,
          activeUsers: liveAnalytics.activeUsers,
        });
      } else if (liveFeatures) {
        setFeatures(liveFeatures);
      }

      setNotice("Studio data is up to date.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to sync Studio data.";
      setError(message);
      setNotice("Studio could not refresh right now. Please try again.");
    } finally {
      setIsLoadingData(false);
    }
  }, [isLiveMode, session?.token]);

  useEffect(() => {
    const storedSession = SecureStorage.getItem(SESSION_KEY);

    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession) as StudioSession);
      } catch {
        SecureStorage.removeItem(SESSION_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && session) {
      void refreshStudioData();
    }
  }, [isHydrated, refreshStudioData, session]);

  useEffect(() => {
    if (isHydrated && isLiveMode && !session) {
      setFeatures([]);
      setAnalyticsOverride(null);
    }
  }, [isHydrated, isLiveMode, session]);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      setError("");

      try {
        const authResponse = await registerFounder(input);
        persistSession(authResponse);
        setNotice(`Welcome to PayMeter Studio, ${authResponse.founder.name}.`);
        return { ok: true };
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to create Studio account.";
        setError(message);
        return { ok: false, message };
      }
    },
    [persistSession],
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      setError("");

      try {
        const authResponse = await loginFounder(input);
        persistSession(authResponse);
        setNotice(`Welcome back, ${authResponse.founder.name}.`);
        return { ok: true };
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to sign in to PayMeter Studio.";
        setError(message);
        return { ok: false, message };
      }
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    if (isLiveMode) {
      try {
        await logoutFounder();
      } catch (err) {
        // Continue logout locally even if backend fails
      }
    }

    setSession(null);
    setAnalyticsOverride(null);
    setFeatures(isLiveMode ? [] : seedFeatures);
    setError("");
    setNotice(isLiveMode ? "Sign in to manage live pricing and usage data." : "Preview data is loaded for the product walkthrough.");

    if (typeof window !== "undefined") {
      SecureStorage.removeItem(SESSION_KEY);
    }
  }, [isLiveMode]);

  const createFeature = useCallback(
    async (input: { name: string; price: number }) => {
      setError("");

      try {
        const created = await createBillableFeature(input, session?.token);
        setFeatures((current) => [created, ...current]);
        setNotice(`${created.name} is now metered at ${formatNaira(created.price)} per use.`);
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to create feature.";
        setError(message);
        throw caughtError;
      }
    },
    [session?.token],
  );

  const updateFeature = useCallback(
    async (featureId: string, input: { name: string; price: number }) => {
      setError("");

      try {
        const updated = await updateBillableFeature(featureId, input, session?.token);
        setFeatures((current) =>
          current.map((feature) =>
            feature.id === featureId
              ? {
                  ...feature,
                  name: updated?.name ?? input.name.trim(),
                  price: updated?.price ?? input.price,
                  active: updated?.active ?? feature.active,
                }
              : feature,
          ),
        );
        setNotice("Feature updated. Historical usage remains intact.");
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to update feature.";
        setError(message);
        throw caughtError;
      }
    },
    [session?.token],
  );

  const toggleFeature = useCallback(
    async (featureId: string) => {
      setError("");

      try {
        const updated = await toggleBillableFeature(featureId, session?.token);
        let nextActiveState = false;

        setFeatures((current) =>
          current.map((feature) => {
            if (feature.id !== featureId) {
              return feature;
            }

            nextActiveState = updated?.active ?? !feature.active;

            return {
              ...feature,
              active: nextActiveState,
            };
          }),
        );
        setNotice(nextActiveState ? "Feature activated for new meter checks." : "Feature deactivated without deleting history.");
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to change feature status.";
        setError(message);
        throw caughtError;
      }
    },
    [session?.token],
  );

  const value = useMemo(
    () => ({
      founderName,
      session,
      isLiveMode,
      isHydrated,
      isLoadingData,
      notice,
      error,
      features,
      analytics,
      register,
      login,
      logout,
      refreshStudioData,
      createFeature,
      updateFeature,
      toggleFeature,
      setNotice,
    }),
    [
      analytics,
      createFeature,
      error,
      features,
      founderName,
      isHydrated,
      isLiveMode,
      isLoadingData,
      login,
      logout,
      notice,
      refreshStudioData,
      register,
      session,
      toggleFeature,
      updateFeature,
    ],
  );

  return <ConsoleDataContext.Provider value={value}>{children}</ConsoleDataContext.Provider>;
}

export function useConsoleData() {
  const context = useContext(ConsoleDataContext);

  if (!context) {
    throw new Error("useConsoleData must be used inside ConsoleDataProvider.");
  }

  return context;
}
