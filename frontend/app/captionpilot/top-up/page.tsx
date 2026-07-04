"use client";

import Link from "next/link";
import { ArrowRight, Banknote, Clipboard, Loader2 } from "lucide-react";
import { CaptionPilotHeader } from "@/components/captionpilot/CaptionPilotHeader";
import { useCaptionPilot } from "@/components/captionpilot/CaptionPilotProvider";
import { formatNaira } from "@/lib/format";

export default function CaptionPilotTopUpPage() {
  const { user, balance, notice, isFunding, simulateTopUp, copyAccountNumber } = useCaptionPilot();

  if (!user) {
    return (
      <>
        <CaptionPilotHeader
          description="Top-up requires a user-specific Nomba virtual account."
          eyebrow="Top up"
          title="Create a customer first."
        />
        <Link
          className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint-700 px-4 text-sm font-semibold text-white transition hover:bg-[#066747]"
          href="/captionpilot"
        >
          Create customer
          <ArrowRight className="size-4" />
        </Link>
      </>
    );
  }

  return (
    <>
      <CaptionPilotHeader
        description="Funding is the only place the Nomba rail takes visual priority inside the customer app."
        eyebrow="Top up"
        title="Transfer into the dedicated Nomba account."
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="overflow-hidden rounded-lg border border-ink/10 bg-nomba-yellow text-ink shadow-line">
          <div className="nomba-dot-field border-b border-ink/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">Top up account</p>
                <p className="mt-2 text-sm font-semibold text-ink">{user.bankName}</p>
              </div>
              <Banknote className="size-6" />
            </div>

            <p className="mt-6 text-3xl font-semibold tracking-normal">{user.accountNumber}</p>
            <p className="mt-2 text-sm text-ink/65">{user.accountName}</p>
          </div>

          <div className="space-y-3 bg-white p-5">
            <p className="text-sm leading-6 text-graphite">
              Transfer any amount to this account. Once the webhook confirms it, PayMeter credits the balance.
            </p>
            <button
              className="focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink/10 bg-paper px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
              onClick={copyAccountNumber}
              type="button"
            >
              <Clipboard className="size-4" />
              Copy account number
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <p className="text-sm font-medium text-graphite">Current balance</p>
          <p className="mt-2 text-4xl font-semibold text-ink">{formatNaira(balance)}</p>
          <p className="mt-4 rounded-lg border border-ink/10 bg-paper px-3 py-3 text-sm text-graphite">{notice}</p>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-ink">Simulate payment confirmation</h2>
            <p className="mt-2 text-sm leading-6 text-graphite">
              Temporary frontend-only controls for demos before the live webhook flow is connected.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((amount) => (
                <button
                  className="focus-ring min-h-11 rounded-lg border border-ink/10 bg-paper text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isFunding}
                  key={amount}
                  onClick={() => simulateTopUp(amount)}
                  type="button"
                >
                  {isFunding ? <Loader2 className="mx-auto size-4 animate-spin" /> : formatNaira(amount)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
