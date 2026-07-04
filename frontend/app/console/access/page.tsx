"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";

type AuthMode = "signup" | "login";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ConsoleAccessPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [founderName, setFounderName] = useState("Bello");
  const [email, setEmail] = useState("bello@paymeter.app");
  const [password, setPassword] = useState("paymeter26");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("Auth is stubbed for the hackathon frontend layer.");

  function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");

    if (authMode === "signup" && founderName.trim().length === 0) {
      setAuthError("Add the founder name so the workspace feels personal.");
      return;
    }

    if (!emailRegex.test(email)) {
      setAuthError("Use a valid email address.");
      return;
    }

    if (password.length < 8) {
      setAuthError("Password should be at least 8 characters for this demo.");
      return;
    }

    setMessage(authMode === "signup" ? "Workspace created. Continue to Overview." : "Login accepted. Continue to Overview.");
  }

  return (
    <>
      <ConsoleHeader
        description="Separate access from the operational dashboard so auth does not compete with feature pricing and analytics."
        eyebrow="Founder access"
        title="Access PayMeter Console."
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[440px_1fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="mb-6 inline-flex rounded-lg border border-ink/10 bg-paper p-1">
            <button
              className={clsx(
                "focus-ring rounded-md px-4 py-2 text-sm font-semibold transition",
                authMode === "signup" ? "bg-ink text-white" : "text-graphite hover:text-ink",
              )}
              onClick={() => setAuthMode("signup")}
              type="button"
            >
              Sign up
            </button>
            <button
              className={clsx(
                "focus-ring rounded-md px-4 py-2 text-sm font-semibold transition",
                authMode === "login" ? "bg-ink text-white" : "text-graphite hover:text-ink",
              )}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Login
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAuth}>
            {authMode === "signup" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Founder name</span>
                <input className="input-shell" onChange={(event) => setFounderName(event.target.value)} value={founderName} />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Email</span>
              <input className="input-shell" inputMode="email" onChange={(event) => setEmail(event.target.value)} value={email} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Password</span>
              <span className="relative block">
                <input
                  className="input-shell pr-12"
                  onChange={(event) => setPassword(event.target.value)}
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

            {authError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p> : null}

            <button className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon">
              {authMode === "signup" ? "Create workspace" : "Enter console"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-ink/10 bg-ink p-6 text-white shadow-line">
          <div className="grid size-12 place-items-center rounded-lg bg-nomba-yellow text-ink">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="mt-6 max-w-xl text-3xl font-semibold leading-tight">Founder access is deliberately quiet.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">
            Judges should not spend mental energy on auth. They should see just enough validation to trust the frontend,
            then move into the metering story.
          </p>
          <p className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/78">{message}</p>
        </div>
      </section>
    </>
  );
}
