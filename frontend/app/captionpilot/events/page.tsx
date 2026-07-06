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
            Write caption
            <ArrowRight className="size-4" />
          </Link>
        }
        description="Review generated captions, naira charges, and attempts that needed payment."
        eyebrow="History"
        title="Your writing activity stays organized."
      />

      <section className="mt-6 rounded-lg border border-ink/10 bg-white p-5 shadow-line">
        {events.length === 0 ? (
          <div className="grid min-h-[320px] place-items-center rounded-lg bg-paper p-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid size-12 place-items-center rounded-lg bg-mint-50 text-mint-700">
                <ListChecks className="size-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-ink">No activity yet</h2>
              <p className="mt-3 text-sm leading-6 text-graphite">
                {user ? "Generate a caption to see the charge and result here." : "Create an account, then write your first paid caption."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-ink/10">
            {events.map((event) => {
              const approved = event.status === "allowed";

              return (
                <div className="grid gap-3 py-4 md:grid-cols-[1fr_140px_120px_160px] md:items-center" key={event.id}>
                  <div>
                    <p className="text-sm font-semibold text-ink">{event.featureName}</p>
                    <p className="mt-1 text-xs text-graphite">{approved ? "Caption generated" : "Payment needed"}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink md:text-right">{formatNaira(event.amount)}</p>
                  <p
                    className={clsx(
                      "text-sm font-semibold md:text-right",
                      approved ? "text-mint-700" : "text-red-700",
                    )}
                  >
                    {approved ? "Completed" : "Declined"}
                  </p>
                  <p className="text-sm text-graphite md:text-right">{event.createdAt}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
