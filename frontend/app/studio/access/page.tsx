"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "@/components/BrandMark";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";

type AuthMode = "signup" | "login";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ConsoleAccessPage() {
  const router = useRouter();
  const { login, logout, register, session } = useConsoleData();
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

  function updateEmail(value: string) {
    setEmail(value);
    setAuthError("");
  }

  function updatePassword(value: string) {
    setPassword(value);
    setAuthError("");
  }

  function switchToSignup() {
    setAuthMode("signup");
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
      setAuthError("This email already has a Studio workspace. Log in with the original password, or use another email to create a new workspace.");
      return;
    }

    if (authMode === "login" && message.toLowerCase().includes("invalid email or password")) {
      setAuthError("Those login details did not match a Studio workspace. Check the password or create a new workspace with this email.");
      return;
    }

    setAuthError(message);
  }

  const showLoginRecovery = authMode === "signup" && authError.toLowerCase().includes("already has a studio workspace");
  const showSignupRecovery = authMode === "login" && authError.toLowerCase().includes("did not match");

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
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-8 flex justify-center">
        <BrandMark />
      </div>
      <div className="text-center">
        <p className="inline-flex rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-graphite shadow-line">
          Studio access
        </p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">Enter PayMeter Studio.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-graphite">
          Create or enter the workspace where a founder manages feature pricing, usage, and revenue.
        </p>
      </div>

      <div className="mt-6">
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
                onChange={(event) => updateEmail(event.target.value)}
                placeholder="founder@company.com"
                value={email}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Password</span>
              <span className="relative block">
                <input
                  className="input-shell pr-12"
                  onChange={(event) => updatePassword(event.target.value)}
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

            {authError ? (
              <div className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">
                <p>{authError}</p>
                {showSignupRecovery ? (
                  <button
                    className="mt-2 text-sm font-semibold text-red-800 underline underline-offset-4"
                    onClick={switchToSignup}
                    type="button"
                  >
                    Create a Studio workspace instead
                  </button>
                ) : null}
                {showLoginRecovery ? (
                  <button
                    className="mt-2 text-sm font-semibold text-red-800 underline underline-offset-4"
                    onClick={() => switchMode("login")}
                    type="button"
                  >
                    Go to login
                  </button>
                ) : null}
              </div>
            ) : null}

            <button
              className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connecting..." : authMode === "signup" ? "Create Studio workspace" : "Enter Studio"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
