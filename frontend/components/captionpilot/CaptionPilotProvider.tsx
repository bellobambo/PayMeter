"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { meterFeatureUse, registerEndUser } from "@/lib/api/paymeter-client";
import { formatNaira } from "@/lib/format";
import type { DemoUser, UsageEvent } from "@/lib/types";

const captionFeature = {
  id: "feat_caption",
  name: "Caption Generation",
  price: 50,
};

type CaptionPilotContextValue = {
  feature: typeof captionFeature;
  user: DemoUser | null;
  balance: number;
  notice: string;
  caption: string;
  events: UsageEvent[];
  lastMeterKey: string;
  isRegistering: boolean;
  isMetering: boolean;
  isFunding: boolean;
  canUseFeature: boolean;
  registerUser: (input: { name: string; email: string }) => Promise<void>;
  runBillableAction: () => Promise<void>;
  simulateTopUp: (amount: number) => Promise<void>;
  copyAccountNumber: () => Promise<void>;
};

const CaptionPilotContext = createContext<CaptionPilotContextValue | null>(null);

export function CaptionPilotProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [notice, setNotice] = useState("Create a CaptionPilot user to receive a dedicated Nomba virtual account.");
  const [caption, setCaption] = useState("");
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [lastMeterKey, setLastMeterKey] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isMetering, setIsMetering] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const canUseFeature = balance >= captionFeature.price;

  const registerUser = useCallback(async (input: { name: string; email: string }) => {
    if (!input.name.trim()) {
      setNotice("End-user name is required.");
      return;
    }

    setIsRegistering(true);
    const registered = await registerEndUser(input);
    setUser(registered);
    setIsRegistering(false);
    setNotice("Nomba virtual account created for this CaptionPilot user.");
  }, []);

  const runBillableAction = useCallback(async () => {
    if (!user || isMetering) {
      return;
    }

    setIsMetering(true);
    const idempotencyKey = `meter_${user.id}_${captionFeature.id}_${Date.now()}`;
    setLastMeterKey(idempotencyKey);

    const result = await meterFeatureUse(
      {
        userId: user.id,
        featureId: captionFeature.id,
        idempotencyKey,
      },
      {
        balance,
        featureName: captionFeature.name,
        featurePrice: captionFeature.price,
      },
    );

    setBalance(result.balance);
    setEvents((current) => (result.usageEvent ? [result.usageEvent, ...current].slice(0, 8) : current));

    if (result.allowed) {
      setCaption("Launch your next idea with metered confidence, simple top-ups, and billing that never surprises your users.");
      setNotice(`${result.message} ${formatNaira(result.chargedAmount)} deducted instantly.`);
    } else {
      setNotice(result.message);
    }

    setIsMetering(false);
  }, [balance, isMetering, user]);

  const simulateTopUp = useCallback(async (amount: number) => {
    if (!user || isFunding) {
      return;
    }

    setIsFunding(true);
    setNotice(`Waiting for a ${formatNaira(amount)} Nomba payment confirmation...`);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setBalance((current) => current + amount);
    setIsFunding(false);
    setNotice(`${formatNaira(amount)} top-up confirmed. Balance updated without a manual refresh.`);
  }, [isFunding, user]);

  const copyAccountNumber = useCallback(async () => {
    if (!user) {
      return;
    }

    await navigator.clipboard?.writeText(user.accountNumber);
    setNotice("Account number copied.");
  }, [user]);

  const value = useMemo(
    () => ({
      feature: captionFeature,
      user,
      balance,
      notice,
      caption,
      events,
      lastMeterKey,
      isRegistering,
      isMetering,
      isFunding,
      canUseFeature,
      registerUser,
      runBillableAction,
      simulateTopUp,
      copyAccountNumber,
    }),
    [
      balance,
      canUseFeature,
      caption,
      copyAccountNumber,
      events,
      isFunding,
      isMetering,
      isRegistering,
      lastMeterKey,
      notice,
      registerUser,
      runBillableAction,
      simulateTopUp,
      user,
    ],
  );

  return <CaptionPilotContext.Provider value={value}>{children}</CaptionPilotContext.Provider>;
}

export function useCaptionPilot() {
  const context = useContext(CaptionPilotContext);

  if (!context) {
    throw new Error("useCaptionPilot must be used inside CaptionPilotProvider.");
  }

  return context;
}
