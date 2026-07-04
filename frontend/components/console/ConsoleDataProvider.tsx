"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createBillableFeature, updateBillableFeature } from "@/lib/api/paymeter-client";
import { seedFeatures } from "@/lib/mock-api";
import type { BillableFeature } from "@/lib/types";

type ConsoleDataContextValue = {
  founderName: string;
  notice: string;
  features: BillableFeature[];
  analytics: {
    totalRevenue: number;
    totalUsage: number;
    activeFeatures: number;
    activeUsers: number;
  };
  createFeature: (input: { name: string; price: number }) => Promise<void>;
  updateFeature: (featureId: string, input: { name: string; price: number }) => Promise<void>;
  toggleFeature: (featureId: string) => Promise<void>;
  setNotice: (notice: string) => void;
};

const ConsoleDataContext = createContext<ConsoleDataContextValue | null>(null);

export function ConsoleDataProvider({ children }: { children: React.ReactNode }) {
  const [founderName] = useState("Bello");
  const [features, setFeatures] = useState<BillableFeature[]>(seedFeatures);
  const [notice, setNotice] = useState("Mock mode active. Ready to connect to Task 2 APIs.");

  const analytics = useMemo(() => {
    const totalRevenue = features.reduce((sum, feature) => sum + feature.price * feature.usageCount, 0);
    const totalUsage = features.reduce((sum, feature) => sum + feature.usageCount, 0);
    const activeFeatures = features.filter((feature) => feature.active).length;

    return {
      totalRevenue,
      totalUsage,
      activeFeatures,
      activeUsers: 184,
    };
  }, [features]);

  const createFeature = useCallback(async (input: { name: string; price: number }) => {
    const created = await createBillableFeature(input);
    setFeatures((current) => [created, ...current]);
    setNotice(`${created.name} is now metered at ₦${created.price.toLocaleString("en-NG")} per use.`);
  }, []);

  const updateFeature = useCallback(async (featureId: string, input: { name: string; price: number }) => {
    await updateBillableFeature(featureId, input);
    setFeatures((current) =>
      current.map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              name: input.name.trim(),
              price: input.price,
            }
          : feature,
      ),
    );
    setNotice("Feature updated. Historical usage remains intact.");
  }, []);

  const toggleFeature = useCallback(async (featureId: string) => {
    let nextActiveState = false;
    setFeatures((current) =>
      current.map((feature) => {
        if (feature.id !== featureId) {
          return feature;
        }

        nextActiveState = !feature.active;

        return {
          ...feature,
          active: nextActiveState,
        };
      }),
    );
    await updateBillableFeature(featureId, { active: nextActiveState });
    setNotice(nextActiveState ? "Feature activated for new meter checks." : "Feature deactivated without deleting history.");
  }, []);

  const value = useMemo(
    () => ({
      founderName,
      notice,
      features,
      analytics,
      createFeature,
      updateFeature,
      toggleFeature,
      setNotice,
    }),
    [analytics, createFeature, features, founderName, notice, toggleFeature, updateFeature],
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
