import { PlugZap } from "lucide-react";
import { taskTwoContracts } from "@/lib/api/contracts";

export function ContractStrip() {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PlugZap className="size-5 text-nomba-gold" />
            <h2 className="text-xl font-semibold text-ink">Backend contracts</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite">
            PayMeter Studio is wired around founder access, protected feature management, analytics, Nomba-backed wallet
            onboarding, and the balance check that protects every paid action.
          </p>
        </div>
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">Frontend ready</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {taskTwoContracts.map((contract) => (
          <div className="rounded-lg border border-ink/10 bg-paper p-4" key={`${contract.method}-${contract.path}`}>
            <span className="rounded-full bg-nomba-yellow px-2.5 py-1 text-[11px] font-bold text-ink">
              {contract.method}
            </span>
            <p className="mt-3 break-words text-sm font-semibold text-ink">{contract.path}</p>
            <p className="mt-2 text-xs leading-5 text-graphite">{contract.purpose}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
