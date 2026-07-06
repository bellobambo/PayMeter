import clsx from "clsx";
import { Gauge } from "lucide-react";

type BrandMarkProps = {
  compact?: boolean;
  inverted?: boolean;
};

export function BrandMark({ compact = false, inverted = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className={clsx(
          "relative grid size-9 place-items-center rounded-lg",
          inverted ? "bg-nomba-yellow text-ink" : "bg-ink text-nomba-yellow",
        )}
      >
        <Gauge className="size-5" strokeWidth={2.6} />
      </div>
      {!compact ? (
        <div className="leading-none">
          <p className={clsx("text-base font-semibold", inverted ? "text-white" : "text-ink")}>PayMeter</p>
          <p className={clsx("mt-1 text-[11px] uppercase tracking-[0.18em]", inverted ? "text-white/55" : "text-graphite/60")}>
            Nomba powered
          </p>
        </div>
      ) : null}
    </div>
  );
}
