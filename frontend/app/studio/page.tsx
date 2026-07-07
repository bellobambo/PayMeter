"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CircleDollarSign, KeyRound, PlugZap, ShieldCheck, Users } from "lucide-react";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { Metric } from "@/components/console/Metric";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { TrustPatternStrip } from "@/components/TrustPatternStrip";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import { compactNumber, formatNaira } from "@/lib/format";

export default function ConsoleOverviewPage() {
  const { founderName, analytics, features, isLiveMode, session, notice } = useConsoleData();

  return (
    <>
      <ConsoleHeader
        action={
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
            href={session || !isLiveMode ? "/studio/features" : "/studio/access"}
          >
            {session || !isLiveMode ? "Create feature" : "Connect Studio"}
            <ArrowRight className="size-4" />
          </Link>
        }
        description="Manage usage-based pricing for your product: define paid actions, watch revenue, and keep every customer action tied to a balance."
        eyebrow="PayMeter Studio"
        title={`Welcome back, ${founderName}.`}
      />

      <section className="mt-6 flex flex-col gap-2 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-graphite shadow-line sm:flex-row sm:items-center sm:justify-between">
        <span>{notice}</span>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">
          {isLiveMode ? (session ? "Connected" : "Sign in required") : "Preview data"}
        </span>
      </section>

      <section className="mt-6 grid gap-3 lg:grid-cols-3">
        {[
          {
            title: "Workspace",
            value: session ? session.founder.email : "Sign in required",
            body: session ? "You can manage live feature pricing and usage data." : "Sign in to manage your real feature catalogue.",
            icon: KeyRound,
            href: "/studio/access",
          },
          {
            title: "Billable features",
            value: `${features.length} configured`,
            body: "Price the product actions customers should pay for per use.",
            icon: PlugZap,
            href: "/studio/features",
          },
          {
            title: "Payment guard",
            value: "Balance before action",
            body: "Customer actions are only allowed when their wallet can cover the price.",
            icon: ShieldCheck,
            href: "/studio/integration",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="focus-ring rounded-lg border border-ink/10 bg-white p-4 shadow-line transition hover:-translate-y-0.5 hover:border-ink/20"
              href={item.href}
              key={item.title}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-2 break-words text-sm font-medium text-graphite">{item.value}</p>
                </div>
                <div className="grid size-9 place-items-center rounded-lg bg-nomba-yellow text-ink">
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-graphite">{item.body}</p>
            </Link>
          );
        })}
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
                body: "The customer app checks balance before it performs the paid action.",
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

        <OnboardingChecklist hasFeature={features.length > 0} hasWorkspace={!isLiveMode || Boolean(session)} />
      </section>
    </>
  );
}
