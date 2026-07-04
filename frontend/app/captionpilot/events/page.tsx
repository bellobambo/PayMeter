"use client";

import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import clsx from "clsx";
import { CaptionPilotHeader } from "@/components/captionpilot/CaptionPilotHeader";
import { useCaptionPilot } from "@/components/captionpilot/CaptionPilotProvider";
import { formatNaira } from "@/lib/format";

export default function CaptionPilotEventsPage() {
  const { user, events } = useCaptionPilot();

  return (
    <>
      <CaptionPilotHeader
        action={
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint-700 px-4 text-sm font-semibold text-white transition hover:bg-[#066747]"
            href="/captionpilot/workspace"
          >
            Run action
            <ArrowRight className="size-4" />
          </Link>
        }
        description="This log is the customer-side evidence that PayMeter allowed or denied each paid action."
        eyebrow="Meter events"
        title="Every billable attempt leaves a visible trail."
      />

      <section className="mt-6 rounded-lg border border-ink/10 bg-white p-5 shadow-line">
        {events.length === 0 ? (
          <div className="grid min-h-[320px] place-items-center rounded-lg bg-paper p-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid size-12 place-items-center rounded-lg bg-mint-50 text-mint-700">
                <ListChecks className="size-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-ink">No meter events yet</h2>
              <p className="mt-3 text-sm leading-6 text-graphite">
                {user ? "Try generating a caption before and after funding the account." : "Create a customer first, then run a paid action."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-ink/10">
            {events.map((event) => (
              <div className="grid gap-3 py-4 md:grid-cols-[1fr_140px_120px_160px] md:items-center" key={event.id}>
                <div>
                  <p className="text-sm font-semibold text-ink">{event.featureName}</p>
                  <p className="mt-1 break-all text-xs text-graphite">{event.id}</p>
                </div>
                <p className="text-sm font-semibold text-ink md:text-right">{formatNaira(event.amount)}</p>
                <p
                  className={clsx(
                    "text-sm font-semibold md:text-right",
                    event.status === "allowed" ? "text-mint-700" : "text-red-700",
                  )}
                >
                  {event.status}
                </p>
                <p className="text-sm text-graphite md:text-right">{event.createdAt}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
