"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, Loader2, PenLine, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { CaptionPilotHeader } from "@/components/captionpilot/CaptionPilotHeader";
import { useCaptionPilot } from "@/components/captionpilot/CaptionPilotProvider";

export default function CaptionPilotSignupPage() {
  const router = useRouter();
  const { user, notice, isRegistering, registerUser } = useCaptionPilot();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await registerUser({ name, email });

    if (created) {
      router.push("/captionpilot/workspace");
    }
  }

  return (
    <>
      <CaptionPilotHeader
        description="For founders, creators, and small teams who need launch copy occasionally, CaptionPilot turns rough campaign notes into channel-ready captions without forcing a monthly subscription."
        eyebrow="CaptionPilot"
        title="Pay per caption when you need campaign copy."
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[440px_1fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint-50 text-mint-700">
              <UserRound className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Create your profile</h2>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Keep your caption history, payment details, and writing preferences in one focused workspace.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSignup}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Full name</span>
              <input
                className="input-shell"
                onChange={(event) => setName(event.target.value)}
                placeholder="Amina Yusuf"
                value={name}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Email address</span>
              <input
                className="input-shell"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="amina@example.com"
                value={email}
              />
            </label>

            <button
              className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint-700 px-4 text-sm font-semibold text-white transition hover:bg-[#066747] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRegistering}
            >
              {isRegistering ? "Creating account..." : "Create account"}
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
              <h2 className="mt-6 text-3xl font-semibold text-ink">Ready to write, {user.name}</h2>
              <p className="mt-3 text-sm leading-6 text-graphite">
                You can turn campaign notes into captions immediately and pay per result in naira.
              </p>
              <div className="mt-6 rounded-lg border border-ink/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Payment account</p>
                <p className="mt-2 text-3xl font-semibold text-ink">{user.accountNumber}</p>
                <p className="mt-1 text-sm text-graphite">
                  {user.bankName} / {user.accountName}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
                  href="/captionpilot/workspace"
                >
                  Start writing
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                  href="/captionpilot/top-up"
                >
                  Add credit
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[420px] content-between gap-8">
              <div>
                <div className="grid size-14 place-items-center rounded-lg bg-mint-50 text-mint-700">
                  <Sparkles className="size-7" />
                </div>
                <h2 className="mt-6 max-w-xl text-3xl font-semibold text-ink">Launch copy without paying for unused months.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-graphite">
                  Draft captions for Instagram, WhatsApp, LinkedIn, and X when you have a campaign to ship, not a subscription to justify.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Profile", "Save your writing workspace."],
                  ["Brief", "Describe the product, offer, or launch."],
                  ["Pay per caption", "Use simple naira pricing per result."],
                ].map(([title, body]) => (
                  <div className="rounded-lg border border-ink/10 bg-white p-4" key={title}>
                    <PenLine className="size-5 text-mint-700" />
                    <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-graphite">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          ["Clear pricing", "The caption price is visible before generation."],
          ["Useful outputs", "Captions are shaped for the channel and tone you choose."],
          ["Writing history", "Generated captions and charges stay easy to review."],
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
