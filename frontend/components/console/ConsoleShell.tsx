"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, FileJson2, LayoutDashboard, LogIn, Smartphone, WalletCards } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "@/components/BrandMark";
import { getApiMode } from "@/lib/api/contracts";

const navItems = [
  {
    href: "/console",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/console/features",
    label: "Features",
    icon: Boxes,
  },
  {
    href: "/console/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/console/integration",
    label: "Integration",
    icon: FileJson2,
  },
  {
    href: "/console/access",
    label: "Access",
    icon: LogIn,
  },
] as const;

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-paper">
      <aside className="border-b border-ink/10 bg-white/90 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col justify-between p-4 lg:p-6">
          <div>
            <div className="flex items-center justify-between">
              <BrandMark />
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-semibold text-graphite lg:hidden">
                Console
              </span>
            </div>

            <div className="mt-6 rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Product</p>
              <p className="mt-2 text-lg font-semibold text-ink">PayMeter Console</p>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Founder control room for feature pricing, usage analytics, and metering contracts.
              </p>
            </div>

            <nav className="mt-5 grid gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const selected = pathname === item.href;

                return (
                  <Link
                    className={clsx(
                      "focus-ring flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                      selected ? "bg-ink text-white" : "text-graphite hover:bg-ink/5 hover:text-ink",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-5 space-y-3">
            <Link
              className="focus-ring flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nomba-yellow px-3 text-sm font-semibold text-ink transition hover:bg-nomba-gold"
              href="/captionpilot"
            >
              <Smartphone className="size-4" />
              Open CaptionPilot
            </Link>
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-line">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <WalletCards className="size-4 text-nomba-gold" />
                {getApiMode()}
              </div>
              <p className="mt-2 text-xs leading-5 text-graphite">
                Payment and metering states are designed for live Nomba handoff.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
