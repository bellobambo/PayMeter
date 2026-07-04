import { BadgeCheck, LockKeyhole, RefreshCcw, ShieldCheck } from "lucide-react";

const patterns = [
  {
    title: "Visible money state",
    body: "Balances, prices, and deductions are always close to the action that spends money.",
    icon: BadgeCheck,
  },
  {
    title: "Action before outcome",
    body: "The demo performs the meter check before showing generated output.",
    icon: ShieldCheck,
  },
  {
    title: "No silent failure",
    body: "Denied, pending, copied, and confirmed states are written as clear product feedback.",
    icon: LockKeyhole,
  },
  {
    title: "Live-readiness",
    body: "Mock data is isolated behind a client layer so API integration stays deliberate.",
    icon: RefreshCcw,
  },
] as const;

export function TrustPatternStrip() {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {patterns.map((pattern) => {
        const Icon = pattern.icon;

        return (
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-line" key={pattern.title}>
            <div className="grid size-9 place-items-center rounded-lg bg-mint-50 text-mint-700">
              <Icon className="size-4" />
            </div>
            <p className="mt-4 text-sm font-semibold text-ink">{pattern.title}</p>
            <p className="mt-2 text-xs leading-5 text-graphite">{pattern.body}</p>
          </div>
        );
      })}
    </section>
  );
}
