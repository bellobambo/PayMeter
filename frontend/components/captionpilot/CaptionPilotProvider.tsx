"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchEndUserBalance,
  listBillableFeatures,
  meterFeatureUse,
  registerEndUser,
  type StudioSession,
} from "@/lib/api/paymeter-client";
import { getApiBaseUrl } from "@/lib/api/contracts";
import { formatNaira } from "@/lib/format";
import type { DemoUser, UsageEvent } from "@/lib/types";

const captionFeature = {
  id: "feat_caption",
  name: "Caption Generation",
  price: 50,
  active: true,
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
  isLiveMode: boolean;
  canUseFeature: boolean;
  registerUser: (input: { name: string; email: string }) => Promise<boolean>;
  runBillableAction: (input: CaptionRequest) => Promise<void>;
  simulateTopUp: (amount: number) => Promise<void>;
  refreshAccount: () => Promise<void>;
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
const STUDIO_SESSION_KEY = "paymeter_studio_session";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PersistedCaptionPilotState = {
  user: DemoUser | null;
  balance: number;
  caption: string;
  events: UsageEvent[];
};

function readStudioSession() {
  const storedSession = window.localStorage.getItem(STUDIO_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as StudioSession;
  } catch {
    window.localStorage.removeItem(STUDIO_SESSION_KEY);
    return null;
  }
}

function formatEventTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

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
  const isLiveMode = Boolean(getApiBaseUrl());
  const [feature, setFeature] = useState(captionFeature);
  const [studioFounderId, setStudioFounderId] = useState<string | null>(null);
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

  const canUseFeature = feature.active && balance >= feature.price;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const studioSession = readStudioSession();
      setStudioFounderId(studioSession?.founder.id ?? null);

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
    if (!isLiveMode) {
      return;
    }

    let isMounted = true;
    let syncTimer: number | null = null;

    async function syncFeatureConfig(token: string) {
      try {
        const liveFeatures = await listBillableFeatures(token);
        const captionConfig = liveFeatures?.find((item) => item.name.toLowerCase() === captionFeature.name.toLowerCase());

        if (isMounted && captionConfig) {
          setFeature({
            id: captionConfig.id,
            name: captionConfig.name,
            price: captionConfig.price,
            active: captionConfig.active,
          });
        }
      } catch {
        if (isMounted) {
          setNotice("Caption pricing could not sync. The saved price will still be checked when you generate.");
        }
      }
    }

    syncTimer = window.setTimeout(() => {
      const studioSession = readStudioSession();
      setStudioFounderId(studioSession?.founder.id ?? null);

      const studioToken = studioSession?.token ?? null;

      if (studioToken) {
        void syncFeatureConfig(studioToken);
      }
    }, 0);

    return () => {
      isMounted = false;
      if (syncTimer) {
        window.clearTimeout(syncTimer);
      }
    };
  }, [isLiveMode]);

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

  const refreshAccount = useCallback(async () => {
    if (!user || !isLiveMode) {
      return;
    }

    try {
      const snapshot = await fetchEndUserBalance(user.id);

      if (!snapshot) {
        return;
      }

      setBalance(Number(snapshot.balance) || 0);
      setEvents(
        snapshot.usageHistory.map((event) => ({
          id: event.id,
          featureName: event.featureName,
          amount: Number(event.amount),
          status: "allowed",
          createdAt: formatEventTime(event.createdAt),
        })),
      );
      setNotice(`Caption credit synced: ${formatNaira(Number(snapshot.balance) || 0)}.`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not refresh caption credit.";
      setNotice(message);
      pushToast({
        tone: "error",
        title: "Credit not refreshed",
        message,
      });
    }
  }, [isLiveMode, pushToast, user]);

  useEffect(() => {
    if (!isRestored || !user || !isLiveMode) {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      void refreshAccount();
    }, 0);

    return () => window.clearTimeout(refreshTimer);
  }, [isLiveMode, isRestored, refreshAccount, user]);

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

    if (!feature.active) {
      setNotice(`${feature.name} is currently unavailable.`);
      pushToast({
        tone: "error",
        title: "Feature unavailable",
        message: "This paid action is currently paused.",
      });
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

    const requestKey = `meter_${user.id}_${feature.id}_${Date.now()}`;

    if (!isLiveMode && balance < feature.price) {
      setNotice(`Add at least ${formatNaira(feature.price)} credit before generating.`);
      setEvents((current) =>
        [
          {
            id: requestKey,
            featureName: feature.name,
            amount: feature.price,
            status: "denied" as const,
            createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
          },
          ...current,
        ].slice(0, 8),
      );
      pushToast({
        tone: "error",
        title: "Insufficient credit",
        message: `Add ${formatNaira(feature.price)} credit before generating this caption.`,
      });
      return;
    }

    setIsMetering(true);
    setCaption("");

    try {
      const meterResult = await meterFeatureUse(
        {
          userId: user.id,
          featureName: feature.name,
          founderId: studioFounderId ?? undefined,
        },
        {
          balance,
          featureName: feature.name,
          featurePrice: feature.price,
        },
      );

      if (!meterResult.allowed) {
        setNotice(`Add at least ${formatNaira(feature.price)} credit before generating.`);
        setEvents((current) =>
          [
            {
              id: requestKey,
              featureName: feature.name,
              amount: feature.price,
              status: "denied" as const,
              createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
            },
            ...current,
          ].slice(0, 8),
        );
        pushToast({
          tone: "error",
          title: "Payment needed",
          message: `This action was declined because current credit is below ${formatNaira(feature.price)}.`,
        });
        return;
      }

      const nextBalance = meterResult.balance;
      setBalance(nextBalance);
      setCaption(buildCaption(input));
      setEvents((current) =>
        [
          {
            id: meterResult.usageEvent?.id ?? requestKey,
            featureName: meterResult.usageEvent?.featureName ?? feature.name,
            amount: meterResult.usageEvent?.amount ?? meterResult.chargedAmount,
            status: "allowed" as const,
            createdAt:
              meterResult.usageEvent?.createdAt ??
              new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
          },
          ...current,
        ].slice(0, 8),
      );
      setNotice(`${formatNaira(meterResult.chargedAmount)} deducted. Your caption credit is now ${formatNaira(nextBalance)}.`);
      pushToast({
        tone: "success",
        title: "Caption generated",
        message: `${formatNaira(meterResult.chargedAmount)} was charged for ${feature.name}.`,
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Caption could not be generated.";
      const paymentMessage =
        message.toLowerCase().includes("insufficient") || message.toLowerCase().includes("denied")
          ? `This action was declined. Add at least ${formatNaira(feature.price)} credit, refresh, then try again.`
          : message;
      setNotice(paymentMessage);
      setEvents((current) =>
        [
          {
            id: requestKey,
            featureName: feature.name,
            amount: feature.price,
            status: "denied" as const,
            createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
          },
          ...current,
        ].slice(0, 8),
      );
      pushToast({
        tone: "error",
        title: "Caption not generated",
        message: paymentMessage,
      });
    } finally {
      setIsMetering(false);
    }
  }, [balance, feature, isLiveMode, isMetering, pushToast, studioFounderId, user]);

  const simulateTopUp = useCallback(async (amount: number) => {
    if (!user || isFunding) {
      return;
    }

    setIsFunding(true);
    setNotice(isLiveMode ? "Checking for confirmed payment..." : `Confirming ${formatNaira(amount)} payment...`);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));

      if (isLiveMode) {
        await refreshAccount();
        pushToast({
          tone: "info",
          title: "Credit refreshed",
          message: "If the payment has been confirmed, the refreshed credit is now visible.",
        });
        return;
      }

      setBalance((current) => current + amount);
      setNotice(`${formatNaira(amount)} added to your caption credit.`);
      pushToast({
        tone: "success",
        title: "Payment confirmed",
        message: `${formatNaira(amount)} credit is available for captions.`,
      });
    } finally {
      setIsFunding(false);
    }
  }, [isFunding, isLiveMode, pushToast, refreshAccount, user]);

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
      feature,
      user,
      balance,
      notice,
      caption,
      events,
      toasts,
      isRegistering,
      isMetering,
      isFunding,
      isLiveMode,
      canUseFeature,
      registerUser,
      runBillableAction,
      simulateTopUp,
      refreshAccount,
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
      feature,
      isFunding,
      isLiveMode,
      isMetering,
      isRegistering,
      notice,
      registerUser,
      refreshAccount,
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
