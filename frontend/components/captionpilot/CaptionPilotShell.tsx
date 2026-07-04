"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Sparkles, Wallet, Wrench } from "lucide-react";
import clsx from "clsx";

const navItems = [
  {
    href: "/captionpilot",
    label: "Signup",
    icon: LayoutDashboard,
  },
  {
    href: "/captionpilot/workspace",
    label: "Workspace",
    icon: Sparkles,
  },
  {
    href: "/captionpilot/top-up",
    label: "Top up",
    icon: Wallet,
  },
  {
    href: "/captionpilot/events",
    label: "Events",
    icon: BarChart3,
  },
] as const;

export function CaptionPilotShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#F6F8F4] text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-[#F6F8F4]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-mint-700 text-white">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none text-ink">CaptionPilot</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">Powered by PayMeter</p>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = pathname === item.href;

              return (
                <Link
                  className={clsx(
                    "focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
                    selected ? "bg-ink text-white" : "text-graphite hover:bg-white hover:text-ink",
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

          <Link
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
            href="/console"
          >
            <Wrench className="size-4" />
            PayMeter Console
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</section>
    </main>
  );
}
