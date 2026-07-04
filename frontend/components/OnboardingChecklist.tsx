import { CheckCircle2, Circle, Rocket } from "lucide-react";

type OnboardingChecklistProps = {
  hasFeature: boolean;
};

export function OnboardingChecklist({ hasFeature }: OnboardingChecklistProps) {
  const items = [
    {
      label: "Founder workspace created",
      complete: true,
    },
    {
      label: "First billable feature configured",
      complete: hasFeature,
    },
    {
      label: "Demo user can fund a Nomba account",
      complete: true,
    },
    {
      label: "Meter check blocks unpaid usage",
      complete: true,
    },
  ];

  return (
    <section className="rounded-lg border border-ink/10 bg-ink p-5 text-white shadow-line">
      <div className="flex items-center gap-2">
        <Rocket className="size-5 text-nomba-yellow" />
        <h2 className="text-xl font-semibold">Launch readiness</h2>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const Icon = item.complete ? CheckCircle2 : Circle;

          return (
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-3 py-3" key={item.label}>
              <Icon className={item.complete ? "size-4 text-nomba-yellow" : "size-4 text-white/40"} />
              <span className="text-sm text-white/78">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
