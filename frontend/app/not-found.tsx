import Link from "next/link";
import { ArrowLeft, RouteOff } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <section className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 text-center shadow-line">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <div className="mx-auto mt-8 grid size-14 place-items-center rounded-lg bg-nomba-yellow text-ink">
          <RouteOff className="size-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-ink">Route not found</h1>
        <p className="mt-3 text-sm leading-6 text-graphite">
          Choose PayMeter Studio for founders or CaptionPilot for the customer experience.
        </p>
        <Link
          className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
          href="/studio/access"
        >
          <ArrowLeft className="size-4" />
          Back to Studio access
        </Link>
      </section>
    </main>
  );
}
