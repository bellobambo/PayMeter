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
  toasts: CaptionPilotToast[];
  isRegistering: boolean;
  isMetering: boolean;
  isFunding: boolean;
  canUseFeature: boolean;
  registerUser: (input: { name: string; email: string }) => Promise<boolean>;
  runBillableAction: (input: CaptionRequest) => Promise<void>;
  simulateTopUp: (amount: number) => Promise<void>;
  copyAccountNumber: () => Promise<void>;
  dismissToast: (id: string) => void;
};

type CaptionRequest = {
  brief: string;
  platform: string;
  tone: string;
};

export type CaptionPilotToast = {
  id: string;
  tone: "success" | "error" | "info";
  title: string;
  message: string;
};

const CaptionPilotContext = createContext<CaptionPilotContextValue | null>(null);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildCaption({ brief, platform, tone }: CaptionRequest) {
  const cleanBrief = brief.trim() || "your next campaign";
  const cleanPlatform = platform.trim() || "your audience";
  const cleanTone = tone.trim().toLowerCase();

  return `${cleanBrief} is ready for customers who want progress without friction. Share it on ${cleanPlatform} with a ${cleanTone} voice: simple promise, clear value, and one confident next step. Start today, pay only when the work gets done.`;
}

export function CaptionPilotProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [notice, setNotice] = useState("Create an account to start writing campaign captions.");
  const [caption, setCaption] = useState("");
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [toasts, setToasts] = useState<CaptionPilotToast[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isMetering, setIsMetering] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const canUseFeature = balance >= captionFeature.price;

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<CaptionPilotToast, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [{ ...toast, id }, ...current].slice(0, 3));
    window.setTimeout(() => dismissToast(id), 5200);
  }, [dismissToast]);

  const registerUser = useCallback(async (input: { name: string; email: string }) => {
    if (!input.name.trim()) {
      setNotice("Enter your name to continue.");
      pushToast({
        tone: "error",
        title: "Name required",
        message: "Add your name so CaptionPilot can create your account.",
      });
      return false;
    }

    if (!emailRegex.test(input.email)) {
      setNotice("Enter a valid email address to create your account.");
      pushToast({
        tone: "error",
        title: "Email looks wrong",
        message: "Use a valid email address to continue.",
      });
      return false;
    }

    try {
      setIsRegistering(true);
      const registered = await registerEndUser(input);
      setUser(registered);
      setNotice("Your account is ready. You can pay in naira whenever you generate.");
      pushToast({
        tone: "success",
        title: "Account created",
        message: "CaptionPilot is ready for paid caption generation.",
      });
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not create your account right now.";
      setNotice(message);
      pushToast({
        tone: "error",
        title: "Account not created",
        message,
      });
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [pushToast]);

  const runBillableAction = useCallback(async (input: CaptionRequest) => {
    if (!user || isMetering) {
      return;
    }

    if (!input.brief.trim()) {
      pushToast({
        tone: "error",
        title: "Brief required",
        message: "Describe the product or campaign before generating.",
      });
      return;
    }

    setIsMetering(true);
    setCaption("");
    const requestKey = `meter_${user.id}_${captionFeature.id}_${Date.now()}`;

    try {
      if (balance < captionFeature.price) {
        setNotice(`Processing ${formatNaira(captionFeature.price)} payment...`);
        pushToast({
          tone: "info",
          title: "Payment started",
          message: `${formatNaira(captionFeature.price)} will be charged for this caption.`,
        });
        await new Promise((resolve) => window.setTimeout(resolve, 720));

        const generatedCaption = buildCaption(input);
        setCaption(generatedCaption);
        setEvents((current) =>
          [
            {
              id: requestKey,
              featureName: captionFeature.name,
              amount: captionFeature.price,
              status: "allowed" as const,
              createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
            },
            ...current,
          ].slice(0, 8),
        );
        setNotice(`${formatNaira(captionFeature.price)} paid. Your caption is ready.`);
        pushToast({
          tone: "success",
          title: "Caption generated",
          message: `${formatNaira(captionFeature.price)} paid successfully.`,
        });
        return;
      }

      const result = await meterFeatureUse(
        {
          userId: user.id,
          featureName: captionFeature.name,
        },
        {
          balance,
          featureName: captionFeature.name,
          featurePrice: captionFeature.price,
        },
      );

      setBalance(result.balance);
      setEvents((current) => (result.usageEvent ? [{ ...result.usageEvent, id: requestKey }, ...current].slice(0, 8) : current));

      if (result.allowed) {
        setCaption(buildCaption(input));
        setNotice(`${formatNaira(result.chargedAmount)} used for this caption. Your credit is now ${formatNaira(result.balance)}.`);
        pushToast({
          tone: "success",
          title: "Caption generated",
          message: `${formatNaira(result.chargedAmount)} deducted from your credit.`,
        });
      } else {
        setNotice(`Pay ${formatNaira(captionFeature.price)} to generate this caption.`);
        pushToast({
          tone: "error",
          title: "Payment needed",
          message: `This caption costs ${formatNaira(captionFeature.price)}.`,
        });
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Payment could not be completed.";
      const friendlyMessage = message.includes("insufficient") || message.includes("denied") ? `Pay ${formatNaira(captionFeature.price)} to generate this caption.` : message;
      setNotice(friendlyMessage);
      pushToast({
        tone: "error",
        title: "Caption not generated",
        message: friendlyMessage,
      });
      setEvents((current) =>
        [
          {
            id: requestKey,
            featureName: captionFeature.name,
            amount: captionFeature.price,
            status: "denied" as const,
            createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
          },
          ...current,
        ].slice(0, 8),
      );
    } finally {
      setIsMetering(false);
    }
  }, [balance, isMetering, pushToast, user]);

  const simulateTopUp = useCallback(async (amount: number) => {
    if (!user || isFunding) {
      return;
    }

    setIsFunding(true);
    setNotice(`Confirming ${formatNaira(amount)} payment...`);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setBalance((current) => current + amount);
    setIsFunding(false);
    setNotice(`${formatNaira(amount)} added to your caption credit.`);
    pushToast({
      tone: "success",
      title: "Payment confirmed",
      message: `${formatNaira(amount)} credit is available for captions.`,
    });
  }, [isFunding, pushToast, user]);

  const copyAccountNumber = useCallback(async () => {
    if (!user) {
      return;
    }

    await navigator.clipboard?.writeText(user.accountNumber);
    setNotice("Account number copied.");
    pushToast({
      tone: "info",
      title: "Copied",
      message: "Payment account number copied.",
    });
  }, [pushToast, user]);

  const value = useMemo(
    () => ({
      feature: captionFeature,
      user,
      balance,
      notice,
      caption,
      events,
      toasts,
      isRegistering,
      isMetering,
      isFunding,
      canUseFeature,
      registerUser,
      runBillableAction,
      simulateTopUp,
      copyAccountNumber,
      dismissToast,
    }),
    [
      balance,
      canUseFeature,
      caption,
      copyAccountNumber,
      dismissToast,
      events,
      isFunding,
      isMetering,
      isRegistering,
      notice,
      registerUser,
      runBillableAction,
      simulateTopUp,
      toasts,
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
