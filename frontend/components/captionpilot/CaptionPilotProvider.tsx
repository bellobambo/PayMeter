"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { registerEndUser } from "@/lib/api/paymeter-client";
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
const CAPTIONPILOT_STORAGE_KEY = "captionpilot_state";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PersistedCaptionPilotState = {
  user: DemoUser | null;
  balance: number;
  caption: string;
  events: UsageEvent[];
};

function sentenceCase(value: string) {
  const cleanValue = value.trim().replace(/\s+/g, " ");
  return cleanValue ? cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1) : "Your next campaign";
}

function buildCaption({ brief, platform, tone }: CaptionRequest) {
  const product = sentenceCase(brief);
  const cleanPlatform = platform.trim();
  const cleanTone = tone.trim();

  const toneMap: Record<string, { hook: string; proof: string; cta: string }> = {
    Confident: {
      hook: `${product} is built for teams that want clearer launches, faster decisions, and less guesswork.`,
      proof: "Turn the messy parts of the work into a simple flow your customers can understand in seconds.",
      cta: "Start with one task today and see the difference before your next campaign goes live.",
    },
    Friendly: {
      hook: `Meet ${product}.`,
      proof: "It helps you move from rough ideas to useful copy without wrestling with a blank page.",
      cta: "Try it on your next launch and give your customers one clear reason to care.",
    },
    Premium: {
      hook: `${product} gives growing teams a sharper way to communicate value.`,
      proof: "Every launch gets cleaner positioning, a stronger customer promise, and copy that feels ready to publish.",
      cta: "Bring more polish to your next campaign without adding another heavy workflow.",
    },
    Direct: {
      hook: `${product} helps you say what matters and move customers to action.`,
      proof: "No vague messaging. No endless rewrite loop. Just launch-ready copy with a clear next step.",
      cta: "Use it for your next campaign and publish faster.",
    },
  };

  const selectedTone = toneMap[cleanTone] ?? toneMap.Confident;
  const hashtagLine = "#Marketing #SmallBusiness #AITools";

  if (cleanPlatform === "X") {
    return `${selectedTone.hook} ${selectedTone.cta}`;
  }

  if (cleanPlatform === "WhatsApp") {
    return `${selectedTone.hook}\n\n${selectedTone.proof}\n\n${selectedTone.cta}`;
  }

  if (cleanPlatform === "LinkedIn") {
    return `${selectedTone.hook}\n\n${selectedTone.proof}\n\nFor founders and teams, the real win is momentum: explain the offer, show the value, and get the next customer conversation started.\n\n${selectedTone.cta}`;
  }

  return `${selectedTone.hook}\n\n${selectedTone.proof}\n\n${selectedTone.cta}\n\n${hashtagLine}`;
}

export function CaptionPilotProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [notice, setNotice] = useState("Create an account to start writing campaign captions.");
  const [caption, setCaption] = useState("");
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [toasts, setToasts] = useState<CaptionPilotToast[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isMetering, setIsMetering] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const canUseFeature = balance >= captionFeature.price;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const savedState = window.localStorage.getItem(CAPTIONPILOT_STORAGE_KEY);

      if (savedState) {
        try {
          const parsed = JSON.parse(savedState) as PersistedCaptionPilotState;
          setUser(parsed.user ?? null);
          setBalance(Number(parsed.balance) || 0);
          setCaption(parsed.caption ?? "");
          setEvents(Array.isArray(parsed.events) ? parsed.events : []);

          if (parsed.user) {
            setNotice(`Welcome back, ${parsed.user.name}.`);
          }
        } catch {
          window.localStorage.removeItem(CAPTIONPILOT_STORAGE_KEY);
        }
      }

      setIsRestored(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!isRestored) {
      return;
    }

    if (!user) {
      window.localStorage.removeItem(CAPTIONPILOT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      CAPTIONPILOT_STORAGE_KEY,
      JSON.stringify({
        user,
        balance,
        caption,
        events,
      } satisfies PersistedCaptionPilotState),
    );
  }, [balance, caption, events, isRestored, user]);

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
      setNotice("Your account is ready. Add caption credit before generating.");
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

    const requestKey = `meter_${user.id}_${captionFeature.id}_${Date.now()}`;

    if (balance < captionFeature.price) {
      setNotice(`Add at least ${formatNaira(captionFeature.price)} credit before generating.`);
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
      pushToast({
        tone: "error",
        title: "Insufficient credit",
        message: `Add ${formatNaira(captionFeature.price)} credit before generating this caption.`,
      });
      return;
    }

    setIsMetering(true);
    setCaption("");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      const nextBalance = Math.max(0, balance - captionFeature.price);
      setBalance(nextBalance);
      setCaption(buildCaption(input));
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
      setNotice(`${formatNaira(captionFeature.price)} deducted. Your caption credit is now ${formatNaira(nextBalance)}.`);
      pushToast({
        tone: "success",
        title: "Caption generated",
        message: `${formatNaira(captionFeature.price)} deducted from your caption credit.`,
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Caption could not be generated.";
      setNotice(message);
      pushToast({
        tone: "error",
        title: "Caption not generated",
        message,
      });
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
