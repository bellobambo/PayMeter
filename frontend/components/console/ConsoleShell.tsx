"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Boxes, FileJson2, Landmark, LayoutDashboard, LogIn, Smartphone, WalletCards } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "@/components/BrandMark";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import { getApiMode } from "@/lib/api/contracts";

const navItems = [
  {
    href: "/studio",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/studio/features",
    label: "Features",
    icon: Boxes,
  },
  {
    href: "/studio/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/studio/settlements",
    label: "Settlements",
    icon: Landmark,
  },
  {
    href: "/studio/integration",
    label: "Integration",
    icon: FileJson2,
  },
  {
    href: "/studio/access",
    label: "Access",
    icon: LogIn,
  },
] as const;

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, isLiveMode, session } = useConsoleData();
  const isAccessRoute = pathname === "/studio/access";
  const shouldShowAuthFirst = isLiveMode && !session && !isAccessRoute;

  useEffect(() => {
    if (isHydrated && shouldShowAuthFirst) {
      router.replace("/studio/access");
    }
  }, [isHydrated, router, shouldShowAuthFirst]);

  if (isLiveMode && !session && isAccessRoute) {
    return (
      <main className="min-h-screen bg-paper">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <aside className="border-b border-white/10 bg-ink text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col justify-between p-4 lg:p-6">
          <div>
            <div className="flex items-center justify-between">
              <BrandMark inverted />
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70 lg:hidden">
                Studio
              </span>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Founder workspace</p>
              <p className="mt-2 text-lg font-semibold text-white">PayMeter Studio</p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                The workspace founders use to price product actions, monitor usage, and connect metering into their own apps.
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
                      selected ? "bg-nomba-yellow text-ink" : "text-white/65 hover:bg-white/[0.07] hover:text-white",
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
              rel="noreferrer"
              target="_blank"
            >
              <Smartphone className="size-4" />
              Open CaptionPilot
            </Link>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <WalletCards className="size-4 text-nomba-gold" />
                {getApiMode()}
              </div>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Payment and metering states are designed for live Nomba handoff.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{shouldShowAuthFirst ? null : children}</div>
      </section>
    </main>
  );
}
