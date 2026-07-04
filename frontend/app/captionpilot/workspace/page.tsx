"use client";

import Link from "next/link";
import { ArrowRight, Loader2, MessageSquareText, ShieldAlert, Wallet } from "lucide-react";
import { CaptionPilotHeader } from "@/components/captionpilot/CaptionPilotHeader";
import { useCaptionPilot } from "@/components/captionpilot/CaptionPilotProvider";
import { formatNaira } from "@/lib/format";

export default function CaptionPilotWorkspacePage() {
  const { user, balance, feature, notice, caption, lastMeterKey, isMetering, runBillableAction } = useCaptionPilot();

  if (!user) {
    return (
      <>
        <CaptionPilotHeader
          description="Create a customer profile first so the app can receive a Nomba virtual account."
          eyebrow="Workspace"
          title="No customer account yet."
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
        action={
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
            href="/captionpilot/top-up"
          >
            <Wallet className="size-4" />
            Top up
          </Link>
        }
        description="The paid action cannot run until PayMeter's meter endpoint allows it. This is the user-facing proof of the entitlement engine."
        eyebrow={`Signed in as ${user.name}`}
        title="Caption workspace."
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-graphite">Available balance</p>
              <p className="mt-2 text-4xl font-semibold text-ink">{formatNaira(balance)}</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Action price</p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatNaira(feature.price)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-ink/10 bg-[#F6F8F4] p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint-50 text-mint-700">
                <MessageSquareText className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">Generate campaign caption</h2>
                <p className="mt-2 text-sm leading-6 text-graphite">
                  CaptionPilot calls <span className="font-semibold text-ink">/api/meter</span> with an idempotency key before the caption appears.
                </p>
              </div>
            </div>

            <button
              className="focus-ring mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint-700 px-4 text-sm font-semibold text-white transition hover:bg-[#066747] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isMetering}
              onClick={runBillableAction}
              type="button"
            >
              {isMetering ? "Checking balance..." : "Generate caption"}
              {isMetering ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </button>

            {lastMeterKey ? (
              <div className="mt-4 rounded-lg border border-ink/10 bg-white px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Meter request key</p>
                <p className="mt-1 break-all text-xs font-medium text-graphite">{lastMeterKey}</p>
              </div>
            ) : null}

            {caption ? (
              <div className="mt-4 rounded-lg border border-mint-100 bg-mint-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mint-700">Generated output</p>
                <p className="mt-2 text-sm leading-6 text-ink">{caption}</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="grid size-10 place-items-center rounded-lg bg-nomba-yellow text-ink">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">Current state</h2>
          <p className="mt-3 text-sm leading-6 text-graphite">{notice}</p>
          <div className="mt-5 rounded-lg border border-ink/10 bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Rule</p>
            <p className="mt-2 text-sm leading-6 text-ink">
              If balance is lower than {formatNaira(feature.price)}, CaptionPilot must show insufficient balance and perform no paid action.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
