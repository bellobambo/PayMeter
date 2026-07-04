"use client";

import { BarChart3, CircleDollarSign, TrendingUp, Users } from "lucide-react";
import clsx from "clsx";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { Metric } from "@/components/console/Metric";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import { compactNumber, formatNaira } from "@/lib/format";

export default function ConsoleAnalyticsPage() {
  const { analytics, features } = useConsoleData();

  return (
    <>
      <ConsoleHeader
        description="A founder should understand revenue and usage without hunting through setup controls."
        eyebrow="Analytics"
        title="Revenue, usage, and adoption at a glance."
      />

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total revenue" value={formatNaira(analytics.totalRevenue)} icon={CircleDollarSign} tone="yellow" />
        <Metric title="Active users" value={compactNumber(analytics.activeUsers)} icon={Users} tone="mint" />
        <Metric title="Metered usage" value={compactNumber(analytics.totalUsage)} icon={BarChart3} tone="ink" />
        <Metric title="Avg. value/use" value={formatNaira(Math.round(analytics.totalRevenue / analytics.totalUsage))} icon={TrendingUp} tone="mint" />
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
          {features.map((feature) => {
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
          })}
        </div>
      </section>
    </>
  );
}
