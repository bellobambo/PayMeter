"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CircleDollarSign, ShieldCheck, Users } from "lucide-react";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { Metric } from "@/components/console/Metric";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { TrustPatternStrip } from "@/components/TrustPatternStrip";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import { compactNumber, formatNaira } from "@/lib/format";

export default function ConsoleOverviewPage() {
  const { founderName, analytics, features, notice } = useConsoleData();

  return (
    <>
      <ConsoleHeader
        action={
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
            href="/console/features"
          >
            Create feature
            <ArrowRight className="size-4" />
          </Link>
        }
        description="PayMeter Console is the founder-facing product: define billable features, watch revenue, and inspect the integration contract that protects every paid action."
        eyebrow="PayMeter Console"
        title={`Good evening, ${founderName}.`}
      />

      <section className="mt-6 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-graphite shadow-line">
        {notice}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total revenue" value={formatNaira(analytics.totalRevenue)} icon={CircleDollarSign} tone="yellow" />
        <Metric title="Active users" value={compactNumber(analytics.activeUsers)} icon={Users} tone="mint" />
        <Metric title="Metered usage" value={compactNumber(analytics.totalUsage)} icon={BarChart3} tone="ink" />
        <Metric title="Live features" value={`${analytics.activeFeatures}/${features.length}`} icon={ShieldCheck} tone="mint" />
      </section>

      <div className="mt-6">
        <TrustPatternStrip />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <h2 className="text-xl font-semibold text-ink">Founder workflow</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Price the feature",
                body: "Create a feature and set a naira price per successful use.",
              },
              {
                title: "Meter before action",
                body: "The customer app calls /meter before it performs the paid action.",
              },
              {
                title: "Read the ledger",
                body: "Allowed and denied checks become usage, balance, and revenue signals.",
              },
            ].map((item, index) => (
              <div className="rounded-lg border border-ink/10 bg-paper p-4" key={item.title}>
                <span className="grid size-8 place-items-center rounded-lg bg-ink text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-xs leading-5 text-graphite">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <OnboardingChecklist hasFeature={features.length > 0} />
      </section>
    </>
  );
}
