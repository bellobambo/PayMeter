"use client";

import { BarChart3, CircleDollarSign, TrendingUp, Users } from "lucide-react";
import clsx from "clsx";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { Metric } from "@/components/console/Metric";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import { compactNumber, formatNaira } from "@/lib/format";

export default function ConsoleAnalyticsPage() {
  const { analytics, error, features, isLoadingData, refreshStudioData, session } = useConsoleData();
  const averageValue = analytics.totalUsage === 0 ? 0 : Math.round(analytics.totalRevenue / analytics.totalUsage);

  return (
    <>
      <ConsoleHeader
        action={
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!session || isLoadingData}
            onClick={refreshStudioData}
            type="button"
          >
            {isLoadingData ? "Syncing..." : "Refresh data"}
          </button>
        }
        description="Understand which paid actions are driving usage and how much customer balance has converted into revenue."
        eyebrow="Analytics"
        title="Revenue, usage, and adoption at a glance."
      />

      {error ? <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total revenue" value={formatNaira(analytics.totalRevenue)} icon={CircleDollarSign} tone="yellow" />
        <Metric title="Active users" value={compactNumber(analytics.activeUsers)} icon={Users} tone="mint" />
        <Metric title="Metered usage" value={compactNumber(analytics.totalUsage)} icon={BarChart3} tone="ink" />
        <Metric title="Avg. value/use" value={formatNaira(averageValue)} icon={TrendingUp} tone="mint" />
      </section>

      <section className="mt-6 rounded-lg border border-ink/10 bg-white p-5 shadow-line">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Usage breakdown</h2>
            <p className="mt-2 text-sm text-graphite">Feature-level usage, revenue, and status.</p>
          </div>
          <p className="text-sm font-semibold text-graphite">{compactNumber(analytics.totalUsage)} total usage events</p>
        </div>

        <div className="mt-6 space-y-4">
          {features.length === 0 ? (
            <div className="rounded-lg border border-ink/10 bg-paper p-5 text-sm text-graphite">
              Create your first billable feature to start seeing usage and revenue here.
            </div>
          ) : (
            features.map((feature) => {
              const percent = analytics.totalUsage === 0 ? 0 : Math.round((feature.usageCount / analytics.totalUsage) * 100);

              return (
                <div className="grid gap-3 md:grid-cols-[200px_1fr_120px_120px] md:items-center" key={feature.id}>
                  <div>
                    <p className="text-sm font-semibold text-ink">{feature.name}</p>
                    <p className={clsx("mt-1 text-xs font-semibold", feature.active ? "text-mint-700" : "text-graphite")}>
                      {feature.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-ink/7">
                    <div
                      className={clsx("h-full rounded-full", feature.active ? "bg-ink" : "bg-graphite/35")}
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-graphite md:text-right">{percent}% usage</p>
                  <p className="text-sm font-semibold text-ink md:text-right">{formatNaira(feature.price * feature.usageCount)}</p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
