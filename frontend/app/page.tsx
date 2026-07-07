import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Code2,
  Landmark,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const productSteps = [
  {
    label: "Price",
    title: "Founder defines a billable action",
    body: "Set a Naira price for actions like AI caption generation, report exports, API calls, or premium searches.",
  },
  {
    label: "Fund",
    title: "Customer pays into a virtual account",
    body: "Each end user receives a Nomba-powered funding path so credit can be tied back to their product account.",
  },
  {
    label: "Meter",
    title: "PayMeter checks before the action runs",
    body: "The founder's app calls PayMeter before showing the paid result. If balance is enough, usage is deducted atomically.",
  },
  {
    label: "Settle",
    title: "Founder withdraws earned revenue",
    body: "Successful usage becomes founder revenue, visible in Studio and withdrawable through a verified settlement account.",
  },
];

const features = [
  {
    icon: WalletCards,
    title: "Nomba-backed funding",
    body: "Virtual account funding and webhook crediting keep customer balances tied to real payment events.",
  },
  {
    icon: ShieldCheck,
    title: "Atomic balance checks",
    body: "Metering is enforced server-side so rapid clicks cannot spend the same balance twice.",
  },
  {
    icon: BarChart3,
    title: "Founder analytics",
    body: "Revenue, active users, feature usage, and attempts are visible from PayMeter Studio.",
  },
  {
    icon: Landmark,
    title: "Revenue settlement",
    body: "Founders can connect a settlement account and request payout from earned usage revenue.",
  },
];

const apiRows = [
  ["Create feature", "POST /api/features"],
  ["Create customer account", "POST /api/nomba/virtual-accounts"],
  ["Run paid action", "POST /api/meter"],
  ["Track revenue", "GET /api/founders/analytics"],
  ["Request payout", "POST /api/founders/settlement/payouts"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 ledger-grid opacity-[0.16]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" aria-hidden="true" />
        <div className="absolute right-8 top-36 hidden w-[36rem] max-w-[42vw] lg:block xl:right-16 xl:top-40" aria-hidden="true">
          <div className="space-y-2 opacity-80">
            {[
              ["Caption Generation", "metered", "NGN 50"],
              ["Customer top-up", "confirmed", "NGN 2,000"],
              ["API report export", "metered", "NGN 250"],
              ["Founder payout", "reserved", "NGN 18,400"],
            ].map(([name, status, amount]) => (
              <div
                className="grid grid-cols-[1fr_92px_96px] gap-2 border-y border-white/10 bg-white/[0.045] px-4 py-3 text-xs backdrop-blur"
                key={name}
              >
                <span className="font-semibold text-white">{name}</span>
                <span className="capitalize text-white/55">{status}</span>
                <span className="text-right font-semibold text-nomba-yellow">{amount}</span>
              </div>
            ))}
          </div>
        </div>

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <BrandMark inverted />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
            <a className="transition hover:text-white" href="#how-it-works">
              How it works
            </a>
            <a className="transition hover:text-white" href="#infrastructure">
              Infrastructure
            </a>
            <Link className="transition hover:text-white" href="/docs">
              Docs
            </Link>
          </nav>
          <Link
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-nomba-yellow px-4 text-sm font-semibold text-ink transition hover:bg-nomba-gold"
            href="/studio/access"
          >
            Enter Studio
            <ArrowRight className="size-4" />
          </Link>
        </header>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
              PayMeter
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-white/72">
              Meter product actions, charge customers in Naira per use, and settle founder revenue with Nomba-powered payment infrastructure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-nomba-yellow px-5 text-sm font-semibold text-ink transition hover:bg-nomba-gold"
                href="/studio/access"
              >
                Launch founder workspace
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/[0.06] px-5 text-sm font-semibold text-white transition hover:bg-white hover:text-ink"
                href="/docs"
              >
                Read integration docs
                <BookOpen className="size-4" />
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-3 border-t border-white/10 pt-5 text-sm text-white/62 sm:grid-cols-3">
            <p>
              <span className="block text-lg font-semibold text-white">Per-use pricing</span>
              Founders price actions, not subscriptions.
            </p>
            <p>
              <span className="block text-lg font-semibold text-white">Balance before outcome</span>
              Paid results appear only after a meter check.
            </p>
            <p>
              <span className="block text-lg font-semibold text-white">Revenue to payout</span>
              Usage logs become withdrawable founder revenue.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            ["Customer pays", "Nomba virtual accounts"],
            ["Action runs", "PayMeter atomic metering"],
            ["Founder earns", "Analytics and settlement"],
          ].map(([title, body]) => (
            <div className="flex items-center gap-3" key={title}>
              <CheckCircle2 className="size-5 shrink-0 text-mint-700" />
              <p className="text-sm text-graphite">
                <span className="font-semibold text-ink">{title}</span>
                <span className="mx-2 text-graphite/35">/</span>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="how-it-works">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">How PayMeter works</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">A payment layer for products that charge by action.</h2>
          <p className="mt-4 text-base leading-7 text-graphite">
            PayMeter lets a founder keep their own product experience while outsourcing the hard parts: balance funding, entitlement checks, usage logs, and payout readiness.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {productSteps.map((step) => (
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-line" key={step.label}>
              <p className="inline-flex rounded-full bg-nomba-yellow px-2.5 py-1 text-xs font-semibold text-ink">{step.label}</p>
              <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-graphite">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-linen/55" id="infrastructure">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Infrastructure surface</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">Built to be invisible inside the founder&apos;s own app.</h2>
            <p className="mt-4 text-base leading-7 text-graphite">
              End users do not need to learn PayMeter. They only experience simple Naira credit, clear pricing, and a paid action that either runs or explains what is needed.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold text-white transition hover:bg-carbon"
                href="/docs"
              >
                View docs
                <Code2 className="size-4" />
              </Link>
              <Link
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                href="/captionpilot"
              >
                See CaptionPilot
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-ink p-4 text-white shadow-soft">
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <p className="text-sm font-semibold">Live meter request</p>
                <span className="rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700">Allowed</span>
              </div>
              <div className="mt-4 space-y-2 font-mono text-xs leading-6 text-white/72">
                <p>POST /api/meter</p>
                <p>{"{"}</p>
                <p className="pl-4">&quot;userId&quot;: &quot;captionpilot_user_001&quot;,</p>
                <p className="pl-4">&quot;featureName&quot;: &quot;Caption Generation&quot;,</p>
                <p className="pl-4">&quot;founderId&quot;: &quot;founder_...&quot;</p>
                <p>{"}"}</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  ["Price", "NGN 50"],
                  ["Deducted", "NGN 50"],
                  ["Remaining", "NGN 1,950"],
                ].map(([label, value]) => (
                  <div className="rounded-md border border-white/10 bg-white/[0.055] p-3" key={label}>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
                    <p className="mt-1 font-semibold text-nomba-yellow">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-line" key={feature.title}>
                <div className="grid size-10 place-items-center rounded-lg bg-mint-50 text-mint-700">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-graphite">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Developer handoff</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">Clear docs for teams integrating PayMeter.</h2>
            <p className="mt-4 text-base leading-7 text-graphite">
              The documentation explains the founder setup, customer funding, paid action request, webhook behavior, and settlement path in the order a real team would implement them.
            </p>
            <Link
              className="focus-ring mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-nomba-yellow px-5 text-sm font-semibold text-ink transition hover:bg-nomba-gold"
              href="/docs"
            >
              Open docs
              <BookOpen className="size-4" />
            </Link>
          </div>
          <div className="divide-y divide-ink/10 rounded-lg border border-ink/10 bg-paper">
            {apiRows.map(([label, endpoint]) => (
              <div className="grid gap-2 p-4 sm:grid-cols-[190px_1fr] sm:items-center" key={endpoint}>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <code className="rounded-md bg-white px-3 py-2 text-sm text-graphite">{endpoint}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <BrandMark inverted />
          <div className="flex flex-col gap-3 text-sm font-semibold text-white/62 sm:flex-row sm:items-center">
            <Link className="transition hover:text-white" href="/docs">
              Docs
            </Link>
            <Link className="transition hover:text-white" href="/studio/access">
              Studio
            </Link>
            <Link className="transition hover:text-white" href="/captionpilot">
              CaptionPilot demo
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
