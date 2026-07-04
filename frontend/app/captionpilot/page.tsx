"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { CaptionPilotHeader } from "@/components/captionpilot/CaptionPilotHeader";
import { useCaptionPilot } from "@/components/captionpilot/CaptionPilotProvider";

export default function CaptionPilotSignupPage() {
  const { user, notice, isRegistering, registerUser } = useCaptionPilot();
  const [name, setName] = useState("Amina Yusuf");
  const [email, setEmail] = useState("amina@example.com");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await registerUser({ name, email });
  }

  return (
    <>
      <CaptionPilotHeader
        description="CaptionPilot is the sample customer app. It is intentionally separate from PayMeter Console so judges can see PayMeter working inside a real product surface."
        eyebrow="Sample SaaS app"
        title="Generate campaign captions only after balance is confirmed."
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[440px_1fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <h2 className="text-xl font-semibold text-ink">Create customer account</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            Task 2 registers the end user, calls Task 1 for a Nomba virtual account, then returns the account details.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSignup}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Name</span>
              <input className="input-shell" onChange={(event) => setName(event.target.value)} value={name} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Email</span>
              <input className="input-shell" onChange={(event) => setEmail(event.target.value)} value={email} />
            </label>

            <button
              className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint-700 px-4 text-sm font-semibold text-white transition hover:bg-[#066747] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRegistering}
            >
              {isRegistering ? "Creating account..." : "Sign up"}
              {isRegistering ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </button>
          </form>

          <p className="mt-4 rounded-lg border border-ink/10 bg-paper px-3 py-3 text-sm text-graphite">{notice}</p>
        </div>

        <div className="ledger-grid rounded-lg border border-ink/10 bg-white p-6 shadow-line">
          {user ? (
            <div className="max-w-xl">
              <div className="grid size-14 place-items-center rounded-lg bg-nomba-yellow text-ink">
                <CreditCard className="size-7" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-ink">Account ready for {user.name}</h2>
              <p className="mt-3 text-sm leading-6 text-graphite">
                CaptionPilot can now route top-ups into this user-specific Nomba account before any paid action runs.
              </p>
              <div className="mt-6 rounded-lg border border-ink/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Nomba account</p>
                <p className="mt-2 text-3xl font-semibold text-ink">{user.accountNumber}</p>
                <p className="mt-1 text-sm text-graphite">{user.bankName} / {user.accountName}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
                  href="/captionpilot/top-up"
                >
                  Top up balance
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                  href="/captionpilot/workspace"
                >
                  Open workspace
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="max-w-md text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-lg bg-mint-50 text-mint-700">
                  <Sparkles className="size-7" />
                </div>
                <h2 className="mt-6 text-3xl font-semibold text-ink">This is not the admin product.</h2>
                <p className="mt-3 text-sm leading-6 text-graphite">
                  It is a separate app that demonstrates why PayMeter exists: users fund a balance, then consume paid features safely.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          ["Product identity", "CaptionPilot has its own customer-facing brand and workflow."],
          ["PayMeter inside", "Metering remains infrastructure, not the whole user app."],
          ["Nomba payment rail", "Virtual accounts appear only where funding is relevant."],
        ].map(([title, body]) => (
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-line" key={title}>
            <ShieldCheck className="size-5 text-mint-700" />
            <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
            <p className="mt-2 text-xs leading-5 text-graphite">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
