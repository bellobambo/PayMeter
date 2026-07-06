"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import clsx from "clsx";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";

type AuthMode = "signup" | "login";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ConsoleAccessPage() {
  const router = useRouter();
  const { error, isLiveMode, login, logout, register, session } = useConsoleData();
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [founderName, setFounderName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function switchMode(mode: AuthMode) {
    setAuthMode(mode);
    setAuthError("");
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");

    if (authMode === "signup" && founderName.trim().length === 0) {
      setAuthError("Enter the founder or business name for this Studio workspace.");
      return;
    }

    if (!emailRegex.test(email)) {
      setAuthError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    const result =
      authMode === "signup"
        ? await register({ name: founderName, email, password })
        : await login({ email, password });

    setIsSubmitting(false);

    if (result.ok) {
      router.replace("/studio");
      return;
    }

    const message = result.message ?? "Could not complete access request.";
    const looksLikeExistingEmail =
      authMode === "signup" &&
      (message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("already defined"));

    if (looksLikeExistingEmail) {
      setAuthMode("login");
      setAuthError("That email already has a Studio workspace. We switched you to login.");
      return;
    }

    setAuthError(message);
  }

  if (session) {
    return (
      <>
        <ConsoleHeader
          description="You already have an active Studio session. Continue to your workspace or sign out to use another founder account."
          eyebrow="Studio access"
          title={`Signed in as ${session.founder.name}.`}
        />

        <section className="mt-6 max-w-2xl rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-mint-50 text-mint-700">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Active founder session</p>
              <p className="mt-1 break-words text-sm text-graphite">{session.founder.email}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
                  href="/studio"
                >
                  Go to Studio
                  <ArrowRight className="size-4" />
                </Link>
                <button
                  className="focus-ring min-h-11 rounded-lg border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                  onClick={logout}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <ConsoleHeader
        description="Create or enter the workspace where a founder manages feature pricing, usage, and revenue."
        eyebrow="Studio access"
        title="Enter PayMeter Studio."
      />

      <section className="mt-6 max-w-xl">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line sm:p-6">
          <div className="mb-6 grid grid-cols-2 rounded-lg border border-ink/10 bg-paper p-1">
            <button
              className={clsx(
                "focus-ring flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
                authMode === "signup" ? "bg-ink text-white" : "text-graphite hover:text-ink",
              )}
              onClick={() => switchMode("signup")}
              type="button"
            >
              <UserPlus className="size-4" />
              Sign up
            </button>
            <button
              className={clsx(
                "focus-ring flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
                authMode === "login" ? "bg-ink text-white" : "text-graphite hover:text-ink",
              )}
              onClick={() => switchMode("login")}
              type="button"
            >
              <LogIn className="size-4" />
              Login
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAuth}>
            {authMode === "signup" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Founder or business name</span>
                <input
                  className="input-shell"
                  onChange={(event) => setFounderName(event.target.value)}
                  placeholder="Tunde Founder"
                  value={founderName}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Email</span>
              <input
                className="input-shell"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="founder@company.com"
                value={email}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Password</span>
              <span className="relative block">
                <input
                  className="input-shell pr-12"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="focus-ring absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-graphite hover:bg-ink/5 hover:text-ink"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>

            {authError || error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError || error}</p> : null}

            <button
              className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connecting..." : authMode === "signup" ? "Create Studio workspace" : "Enter Studio"}
              <ArrowRight className="size-4" />
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-graphite">
            {isLiveMode ? "Secure Studio access is connected." : "Preview mode is active until the backend URL is configured."}
          </p>
        </div>
      </section>
    </>
  );
}
