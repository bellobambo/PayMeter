"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, Loader2, MessageSquareText, ReceiptText } from "lucide-react";
import { CaptionPilotHeader } from "@/components/captionpilot/CaptionPilotHeader";
import { useCaptionPilot } from "@/components/captionpilot/CaptionPilotProvider";
import { formatNaira } from "@/lib/format";

const platformOptions = ["Instagram", "WhatsApp", "LinkedIn", "X"];
const toneOptions = ["Confident", "Friendly", "Premium", "Direct"];

export default function CaptionPilotWorkspacePage() {
  const { user, balance, feature, notice, caption, isMetering, canUseFeature, runBillableAction } = useCaptionPilot();
  const [brief, setBrief] = useState("An AI bookkeeping assistant for small Nigerian businesses");
  const [platform, setPlatform] = useState(platformOptions[0]);
  const [tone, setTone] = useState(toneOptions[0]);

  if (!user) {
    return (
      <>
        <CaptionPilotHeader
          description="Create your writing profile first, then generate captions with simple naira payments."
          eyebrow="Write"
          title="Start with an account."
        />
        <Link
          className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint-700 px-4 text-sm font-semibold text-white transition hover:bg-[#066747]"
          href="/captionpilot"
        >
          Create account
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
            <CreditCard className="size-4" />
            Add credit
          </Link>
        }
        description="Write channel-ready launch copy and pay only when a caption is generated."
        eyebrow={`Signed in as ${user.name}`}
        title="Write a campaign caption."
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-graphite">Caption credit</p>
              <p className="mt-2 text-4xl font-semibold text-ink">{formatNaira(balance)}</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Caption price</p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatNaira(feature.price)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-ink/10 bg-[#F6F8F4] p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint-50 text-mint-700">
                <MessageSquareText className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">Campaign brief</h2>
                <p className="mt-2 text-sm leading-6 text-graphite">
                  Describe what you are launching. You will see the price before the caption is created.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Product or campaign</span>
                <textarea
                  className="input-shell min-h-28 resize-none"
                  onChange={(event) => setBrief(event.target.value)}
                  value={brief}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Channel</span>
                  <select className="input-shell" onChange={(event) => setPlatform(event.target.value)} value={platform}>
                    {platformOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Tone</span>
                  <select className="input-shell" onChange={(event) => setTone(event.target.value)} value={tone}>
                    {toneOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <button
              className="focus-ring mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint-700 px-4 text-sm font-semibold text-white transition hover:bg-[#066747] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isMetering}
              onClick={() => runBillableAction({ brief, platform, tone })}
              type="button"
            >
              {isMetering ? "Generating..." : canUseFeature ? `Generate caption - ${formatNaira(feature.price)}` : `Add ${formatNaira(feature.price)} credit to generate`}
              {isMetering ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </button>

            {!canUseFeature ? (
              <Link
                className="focus-ring mt-3 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                href="/captionpilot/top-up"
              >
                Add credit instead
                <CreditCard className="size-4" />
              </Link>
            ) : null}

            {caption ? (
              <div className="mt-4 rounded-lg border border-mint-100 bg-mint-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mint-700">Generated caption</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{caption}</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="grid size-10 place-items-center rounded-lg bg-nomba-yellow text-ink">
            {canUseFeature ? <CheckCircle2 className="size-5" /> : <ReceiptText className="size-5" />}
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">{canUseFeature ? "Ready to write" : "Pay per caption"}</h2>
          <p className="mt-3 text-sm leading-6 text-graphite">{notice}</p>
          <div className="mt-5 rounded-lg border border-ink/10 bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Pricing</p>
            <p className="mt-2 text-sm leading-6 text-ink">
              Each generated caption costs {formatNaira(feature.price)}. You need enough caption credit before generation, and credit is deducted only after a caption is produced.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
