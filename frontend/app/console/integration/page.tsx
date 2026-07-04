import { ContractStrip } from "@/components/ContractStrip";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { getApiBaseUrl, getApiMode } from "@/lib/api/contracts";

export default function ConsoleIntegrationPage() {
  return (
    <>
      <ConsoleHeader
        description="This page is for the team and judges: it shows exactly where the frontend hands off to Task 2 and where Task 2 hands off to Nomba through Task 1."
        eyebrow="Integration"
        title="A clean boundary between UI, metering, and payment rails."
      />

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">API mode</p>
          <p className="mt-3 text-2xl font-semibold text-ink">{getApiMode()}</p>
          <p className="mt-2 text-sm leading-6 text-graphite">
            {getApiBaseUrl() || "No NEXT_PUBLIC_API_BASE_URL is configured, so the frontend uses mock data."}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-nomba-yellow p-5 text-ink shadow-line">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">Payment ownership</p>
          <p className="mt-3 text-2xl font-semibold">Nomba stays server-side</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            The frontend displays virtual account and balance states only. Credentials, webhooks, and account creation stay off the client.
          </p>
        </div>
      </section>

      <div className="mt-6">
        <ContractStrip />
      </div>
    </>
  );
}
