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
import { SecureStorage } from "@/lib/secureStorage";
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
  creditMode: CreditMode;
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
  setCreditMode: (mode: CreditMode) => void;
  copyAccountNumber: () => Promise<void>;
  dismissToast: (id: string) => void;
};

type CaptionRequest = {
  brief: string;
  platform: string;
  tone: string;
};

type CreditMode = "confirmed" | "test";

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
  creditMode?: CreditMode;
  caption: string;
  events: UsageEvent[];
};

function isCreditMode(value: unknown): value is CreditMode {
  return value === "confirmed" || value === "test";
}

function readStudioSession() {
  const storedSession = SecureStorage.getItem(STUDIO_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as StudioSession;
  } catch {
    SecureStorage.removeItem(STUDIO_SESSION_KEY);
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

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function stripPromptLanguage(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(please\s+)?(generate|write|create|draft|make)\s+(a|an|the)?\s*/i, "")
    .replace(/^(launch\s+)?(campaign|caption|post|copy|ad|announcement)\s+(for|about)\s+/i, "")
    .replace(/^for\s+/i, "");
}

function parseCampaignBrief(brief: string) {
  const cleaned = stripPromptLanguage(brief);
  const match = cleaned.match(/^(.+?)(?:,?\s+(?:which is|that is|it's|it is)\s+(?:a|an|the)?\s+(.+))$/i);
  const firstComma = cleaned.indexOf(",");

  const rawProduct = match?.[1] ?? (firstComma > 0 ? cleaned.slice(0, firstComma) : cleaned);
  const rawDescription = match?.[2] ?? (firstComma > 0 ? cleaned.slice(firstComma + 1) : "");
  const productName = titleCase(rawProduct.replace(/[.!?]$/g, "")) || "Your product";
  const descriptor = rawDescription
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/[.!?]$/g, "")
    .trim();

  return {
    productName,
    descriptor: descriptor || "a product built to help customers move faster with less friction",
  };
}

function chooseAudience(descriptor: string) {
  const lower = descriptor.toLowerCase();

  if (lower.includes("founder") || lower.includes("startup") || lower.includes("cofounder")) {
    return "founders";
  }

  if (lower.includes("business") || lower.includes("sme") || lower.includes("merchant")) {
    return "small business owners";
  }

  if (lower.includes("creator") || lower.includes("content")) {
    return "creators";
  }

  if (lower.includes("team") || lower.includes("company")) {
    return "teams";
  }

  return "customers";
}

function buildHashtags(productName: string, descriptor: string) {
  const words = `${productName} ${descriptor}`
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word, index, wordsArray) => wordsArray.findIndex((candidate) => candidate.toLowerCase() === word.toLowerCase()) === index)
    .slice(0, 3);

  const tags = words.map((word) => `#${titleCase(word).replace(/\s/g, "")}`);

  if (!tags.some((tag) => tag.toLowerCase().includes("startup")) && descriptor.toLowerCase().includes("founder")) {
    tags.push("#Startup");
  }

  return tags.slice(0, 4).join(" ");
}

function buildCaption({ brief, platform, tone }: CaptionRequest) {
  const { productName, descriptor } = parseCampaignBrief(brief);
  const audience = chooseAudience(descriptor);
  const cleanPlatform = platform.trim();
  const cleanTone = tone.trim();

  const toneMap: Record<string, { hook: string; proof: string; cta: string }> = {
    Confident: {
      hook: `${productName} helps ${audience} turn the right connection into real momentum.`,
      proof: `As a ${descriptor}, it makes the next step feel clearer, faster, and less dependent on luck.`,
      cta: "Start with the match that could move your idea from waiting to building.",
    },
    Friendly: {
      hook: `Meet ${productName}: a simpler way for ${audience} to find the right next person to build with.`,
      proof: `It takes the stress out of ${descriptor} and helps good ideas meet people who can actually move them forward.`,
      cta: "Bring your idea, share what you need, and start a better conversation today.",
    },
    Premium: {
      hook: `${productName} gives ambitious ${audience} a sharper way to find aligned partners.`,
      proof: `For anyone serious about ${descriptor}, it creates a more intentional path from idea to collaboration.`,
      cta: "Build with more clarity, stronger alignment, and fewer cold-start conversations.",
    },
    Direct: {
      hook: `${productName} helps ${audience} find the right co-builder faster.`,
      proof: `If you are working on ${descriptor}, this is a cleaner way to meet people who match your stage, skills, and ambition.`,
      cta: "Create your profile, find a fit, and start building.",
    },
  };

  const selectedTone = toneMap[cleanTone] ?? toneMap.Confident;
  const hashtagLine = buildHashtags(productName, descriptor);

  if (cleanPlatform === "X") {
    return `${selectedTone.hook}\n\n${selectedTone.cta}`;
  }

  if (cleanPlatform === "WhatsApp") {
    return `${selectedTone.hook}\n\n${selectedTone.proof}\n\n${selectedTone.cta}`;
  }

  if (cleanPlatform === "LinkedIn") {
    return `${selectedTone.hook}\n\n${selectedTone.proof}\n\nFor ${audience}, the hard part is rarely ambition. It is finding someone with the right context, trust, and complementary strength at the right time.\n\n${selectedTone.cta}`;
  }

  return `${selectedTone.hook}\n\n${selectedTone.proof}\n\n${selectedTone.cta}\n\n${hashtagLine}`;
}

export function CaptionPilotProvider({ children }: { children: React.ReactNode }) {
  const isLiveMode = Boolean(getApiBaseUrl());
  const [feature, setFeature] = useState(captionFeature);
  const [studioFounderId, setStudioFounderId] = useState<string | null>(null);
  const [studioToken, setStudioToken] = useState<string | null>(null);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [creditMode, setCreditModeState] = useState<CreditMode>("confirmed");
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
      setStudioToken(studioSession?.token ?? null);

      const savedState = SecureStorage.getItem(CAPTIONPILOT_STORAGE_KEY);

      if (savedState) {
        try {
          const parsed = JSON.parse(savedState) as PersistedCaptionPilotState;
          setUser(parsed.user ?? null);
          setBalance(Number(parsed.balance) || 0);
          setCreditModeState(isCreditMode(parsed.creditMode) ? parsed.creditMode : "confirmed");
          setCaption(parsed.caption ?? "");
          setEvents(Array.isArray(parsed.events) ? parsed.events : []);

          if (parsed.user) {
            setNotice(`Welcome back, ${parsed.user.name}.`);
          }
        } catch {
          SecureStorage.removeItem(CAPTIONPILOT_STORAGE_KEY);
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
      setStudioToken(studioToken);

      if (studioSession) {
        void syncFeatureConfig(studioToken ?? "");
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
      SecureStorage.removeItem(CAPTIONPILOT_STORAGE_KEY);
      return;
    }

    SecureStorage.setItem(
      CAPTIONPILOT_STORAGE_KEY,
      JSON.stringify({
        user,
        balance,
        creditMode,
        caption,
        events,
      } satisfies PersistedCaptionPilotState),
    );
  }, [balance, caption, creditMode, events, isRestored, user]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<CaptionPilotToast, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [{ ...toast, id }, ...current].slice(0, 3));
    window.setTimeout(() => dismissToast(id), 5200);
  }, [dismissToast]);

  const setCreditMode = useCallback((mode: CreditMode) => {
    setCreditModeState(mode);
    setNotice(mode === "test" ? "Test credit mode is active for this browser." : "Confirmed payment mode is active.");
    pushToast({
      tone: "info",
      title: mode === "test" ? "Test credit enabled" : "Confirmed payment enabled",
      message:
        mode === "test"
          ? "Use test credit to try CaptionPilot without waiting for payment confirmation."
          : "Credit will refresh from confirmed payments.",
    });
  }, [pushToast]);

  const refreshAccount = useCallback(async () => {
    if (!user || !isLiveMode) {
      return;
    }

    try {
      const snapshot = await fetchEndUserBalance(user.id, studioToken);

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
  }, [isLiveMode, pushToast, studioToken, user]);

  useEffect(() => {
    if (!isRestored || !user || !isLiveMode || creditMode === "test") {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      void refreshAccount();
    }, 0);

    return () => window.clearTimeout(refreshTimer);
  }, [creditMode, isLiveMode, isRestored, refreshAccount, user]);

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

    if (isLiveMode && !studioFounderId) {
      const message = "Your workspace session expired. Reopen CaptionPilot from Studio and try again.";
      setNotice(message);
      pushToast({
        tone: "error",
        title: "Session needed",
        message,
      });
      return false;
    }

    try {
      setIsRegistering(true);
      const registered = await registerEndUser(input, studioToken);
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
  }, [isLiveMode, pushToast, studioToken]);

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
    const usesConfirmedMeter = isLiveMode && creditMode === "confirmed";

    if (usesConfirmedMeter && !studioFounderId) {
      const message = "Your workspace session expired. Reopen CaptionPilot from Studio and try again.";
      setNotice(message);
      pushToast({
        tone: "error",
        title: "Session needed",
        message,
      });
      return;
    }

    if (!usesConfirmedMeter && balance < feature.price) {
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
      const meterResult = usesConfirmedMeter
        ? await meterFeatureUse(
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
            studioToken,
          )
        : {
            allowed: true,
            balance: balance - feature.price,
            chargedAmount: feature.price,
            message: "Test credit allowed.",
            usageEvent: {
              id: requestKey,
              featureName: feature.name,
              amount: feature.price,
              status: "allowed" as const,
              createdAt: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
            },
          };

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
  }, [balance, creditMode, feature, isLiveMode, isMetering, pushToast, studioFounderId, studioToken, user]);

  const simulateTopUp = useCallback(async (amount: number) => {
    if (!user || isFunding) {
      return;
    }

    setIsFunding(true);
    const usesConfirmedCredit = isLiveMode && creditMode === "confirmed";
    setNotice(usesConfirmedCredit ? "Checking for confirmed payment..." : `Adding ${formatNaira(amount)} test credit...`);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));

      if (usesConfirmedCredit) {
        await refreshAccount();
        pushToast({
          tone: "info",
          title: "Credit refreshed",
          message: "If the payment has been confirmed, the refreshed credit is now visible.",
        });
        return;
      }

      setBalance((current) => current + amount);
      setNotice(`${formatNaira(amount)} test credit added to this browser.`);
      pushToast({
        tone: "success",
        title: "Test credit added",
        message: `${formatNaira(amount)} credit is available for captions.`,
      });
    } finally {
      setIsFunding(false);
    }
  }, [creditMode, isFunding, isLiveMode, pushToast, refreshAccount, user]);

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
      creditMode,
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
      setCreditMode,
      copyAccountNumber,
      dismissToast,
    }),
    [
      balance,
      canUseFeature,
      caption,
      copyAccountNumber,
      creditMode,
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
      setCreditMode,
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
