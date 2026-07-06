"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, CheckCircle2, CreditCard, History, Info, PenLine, UserRound, X } from "lucide-react";
import clsx from "clsx";
import { useCaptionPilot, type CaptionPilotToast } from "@/components/captionpilot/CaptionPilotProvider";
import { formatNaira } from "@/lib/format";

const navItems = [
  {
    href: "/captionpilot/workspace",
    label: "Write",
    icon: PenLine,
  },
  {
    href: "/captionpilot/top-up",
    label: "Payments",
    icon: CreditCard,
  },
  {
    href: "/captionpilot/events",
    label: "History",
    icon: History,
  },
  {
    href: "/captionpilot",
    label: "Profile",
    icon: UserRound,
  },
] as const;

function CaptionPilotLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-xl bg-[#0B7F5C] text-white shadow-line">
        <PenLine className="size-5" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-lg font-semibold leading-none text-ink">CaptionPilot</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">AI captions, priced per use</p>
      </div>
    </div>
  );
}

function ToastIcon({ tone }: { tone: CaptionPilotToast["tone"] }) {
  if (tone === "success") {
    return <CheckCircle2 className="size-5 text-mint-700" />;
  }

  if (tone === "error") {
    return <AlertCircle className="size-5 text-red-700" />;
  }

  return <Info className="size-5 text-ink" />;
}

export function CaptionPilotShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { balance, dismissToast, toasts, user } = useCaptionPilot();

  return (
    <main className="min-h-screen bg-[#F7F8F3] text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-[#F7F8F3]/94 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <CaptionPilotLogo />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {user ? (
              <div className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ink/10 bg-white px-3 text-sm font-semibold text-ink shadow-line">
                Credit {formatNaira(balance)}
              </div>
            ) : null}

            <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-ink/10 bg-white p-1 shadow-line lg:w-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const selected = pathname === item.href;

                return (
                  <Link
                    className={clsx(
                      "focus-ring inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
                      selected ? "bg-ink text-white" : "text-graphite hover:bg-[#F4F6F1] hover:text-ink",
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
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</section>

      <div className="fixed right-4 top-24 z-40 grid w-[min(380px,calc(100vw-2rem))] gap-3">
        {toasts.map((toast) => (
          <div
            className={clsx(
              "rounded-xl border bg-white p-4 shadow-[0_18px_60px_rgba(11,12,14,0.14)]",
              toast.tone === "success" && "border-mint-100",
              toast.tone === "error" && "border-red-100",
              toast.tone === "info" && "border-ink/10",
            )}
            key={toast.id}
          >
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F4F6F1]">
                <ToastIcon tone={toast.tone} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{toast.title}</p>
                <p className="mt-1 text-sm leading-5 text-graphite">{toast.message}</p>
              </div>
              <button
                aria-label="Dismiss notification"
                className="focus-ring grid size-8 shrink-0 place-items-center rounded-md text-graphite hover:bg-ink/5 hover:text-ink"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
