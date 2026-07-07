import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Code2, KeyRound, Landmark, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const quickstart = [
  {
    title: "Create a founder workspace",
    body: "Sign in to PayMeter Studio, create your product workspace, and define the paid actions your customers will use.",
    endpoint: "POST /api/founders/register",
  },
  {
    title: "Price your feature",
    body: "Create a feature such as Caption Generation and set the Naira price per successful use.",
    endpoint: "POST /api/features",
  },
  {
    title: "Register an end user",
    body: "Create or fetch the customer's Nomba-backed virtual account so they can fund usage credit.",
    endpoint: "POST /api/nomba/virtual-accounts",
  },
  {
    title: "Check the meter before output",
    body: "Call PayMeter from your backend before showing a paid result. If allowed, run the product action.",
    endpoint: "POST /api/meter",
  },
];

const principles = [
  {
    icon: ShieldCheck,
    title: "Server-side credentials",
    body: "Nomba credentials and founder API keys must stay on the founder's backend, never in a browser client.",
  },
  {
    icon: ReceiptText,
    title: "Charge only on allowed use",
    body: "The customer should see the paid outcome only after PayMeter approves and deducts the action price.",
  },
  {
    icon: WalletCards,
    title: "Funding is separate from usage",
    body: "Virtual account payments increase customer credit. Meter checks deduct only when a product action runs.",
  },
  {
    icon: Landmark,
    title: "Founder revenue settles later",
    body: "Successful usage logs become revenue that the founder can withdraw through settlements.",
  },
];

const snippets = [
  {
    title: "Meter a paid action",
    code: `const response = await fetch("https://paymeter.onrender.com/api/meter", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <founder_api_key>"
  },
  body: JSON.stringify({
    userId: "captionpilot_user_001",
    featureName: "Caption Generation",
    founderId: "<founder_id>"
  })
});

const result = await response.json();

if (!result.success) {
  throw new Error("Customer needs more credit");
}`,
  },
  {
    title: "Recommended product flow",
    code: `1. Customer clicks a paid action
2. Your backend calls PayMeter /api/meter
3. If denied, return a payment-needed state
4. If allowed, run your product logic
5. Return the paid output to the customer
6. PayMeter Studio updates usage and revenue`,
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Link
              className="focus-ring hidden min-h-10 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white sm:inline-flex"
              href="/"
            >
              <ArrowLeft className="size-4" />
              Home
            </Link>
            <Link
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
              href="/studio/access"
            >
              Open Studio
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
            <BookOpen className="size-3.5 text-nomba-yellow" />
            PayMeter docs
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Integrate usage-based billing without rebuilding payment infrastructure.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
            This guide shows how founders use PayMeter to price product actions, fund customer balances with Nomba, run atomic meter checks, and withdraw earned revenue.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-lg border border-ink/10 bg-white p-5 shadow-line">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Navigation</p>
            <nav className="mt-4 grid gap-2 text-sm font-semibold text-graphite">
              <a className="rounded-md px-3 py-2 transition hover:bg-paper hover:text-ink" href="#quickstart">
                Quickstart
              </a>
              <a className="rounded-md px-3 py-2 transition hover:bg-paper hover:text-ink" href="#architecture">
                Architecture rules
              </a>
              <a className="rounded-md px-3 py-2 transition hover:bg-paper hover:text-ink" href="#api">
                API examples
              </a>
              <a className="rounded-md px-3 py-2 transition hover:bg-paper hover:text-ink" href="#demo">
                Demo route map
              </a>
            </nav>
          </aside>

          <div className="space-y-14">
            <section id="quickstart">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Quickstart</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink">Four calls to a paid action.</h2>
                <p className="mt-3 text-base leading-7 text-graphite">
                  In production, a founder's backend owns the integration. The frontend can show pricing and balances, but it should not hold secrets or bypass the meter.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {quickstart.map((step, index) => (
                  <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-line" key={step.title}>
                    <p className="inline-flex rounded-full bg-nomba-yellow px-2.5 py-1 text-xs font-semibold text-ink">Step {index + 1}</p>
                    <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-graphite">{step.body}</p>
                    <code className="mt-4 block rounded-md bg-paper px-3 py-2 text-sm text-graphite">{step.endpoint}</code>
                  </article>
                ))}
              </div>
            </section>

            <section id="architecture">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Architecture rules</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink">Keep PayMeter invisible but authoritative.</h2>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {principles.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-line" key={item.title}>
                      <div className="grid size-10 place-items-center rounded-lg bg-mint-50 text-mint-700">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-ink">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-graphite">{item.body}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section id="api">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">API examples</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink">Call the meter before your product output.</h2>
              </div>
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {snippets.map((snippet) => (
                  <article className="rounded-lg border border-ink/10 bg-ink p-5 text-white shadow-soft" key={snippet.title}>
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                      <Code2 className="size-4 text-nomba-yellow" />
                      {snippet.title}
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-white/72">
                      <code>{snippet.code}</code>
                    </pre>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-line" id="demo">
              <div className="flex items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-nomba-yellow text-ink">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Demo route map</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">Where to go in this build.</h2>
                  <div className="mt-5 grid gap-3 text-sm text-graphite sm:grid-cols-2">
                    <p>
                      <span className="block font-semibold text-ink">Founder console</span>
                      `/studio/access`, `/studio/features`, `/studio/analytics`, `/studio/settlements`
                    </p>
                    <p>
                      <span className="block font-semibold text-ink">Customer demo app</span>
                      `/captionpilot`, `/captionpilot/workspace`, `/captionpilot/top-up`, `/captionpilot/events`
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
