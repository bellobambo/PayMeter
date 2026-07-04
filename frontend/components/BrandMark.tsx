import clsx from "clsx";

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
        <span className="absolute h-1 w-6 rotate-[28deg] rounded-full bg-current" />
        <span className="absolute h-1 w-6 -rotate-[28deg] rounded-full bg-current" />
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
