import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type MetricProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: "yellow" | "mint" | "ink";
};

export function Metric({ title, value, icon: Icon, tone }: MetricProps) {
  return (
    <div className="metric-panel">
      <div
        className={clsx(
          "grid size-10 place-items-center rounded-lg",
          tone === "yellow" && "bg-nomba-yellow text-ink",
          tone === "mint" && "bg-mint-50 text-mint-700",
          tone === "ink" && "bg-ink text-white",
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="mt-5 text-sm font-medium text-graphite">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
