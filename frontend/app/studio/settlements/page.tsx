"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, CheckCircle2, Landmark, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { Metric } from "@/components/console/Metric";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import {
  createFounderPayout,
  getFounderSettlementSummary,
  listSettlementBanks,
  verifySettlementAccount,
} from "@/lib/api/paymeter-client";
import { formatNaira } from "@/lib/format";
import type { SettlementAccount, SettlementBank, SettlementPayout, SettlementSummaryResponse } from "@/lib/api/contracts";

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function payoutTone(status: SettlementPayout["status"]) {
  if (status === "paid") {
    return "bg-mint-50 text-mint-700";
  }

  if (status === "failed" || status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-nomba-yellow/20 text-ink";
}

export default function StudioSettlementsPage() {
  const { isLiveMode, session } = useConsoleData();
  const [summary, setSummary] = useState<SettlementSummaryResponse["summary"] | null>(null);
  const [settlementAccount, setSettlementAccount] = useState<SettlementAccount | null>(null);
  const [payouts, setPayouts] = useState<SettlementPayout[]>([]);
  const [banks, setBanks] = useState<SettlementBank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = session?.token ?? null;
  const requiresSession = isLiveMode && !session;
  const selectedBank = useMemo(() => banks.find((bank) => bank.code === bankCode), [bankCode, banks]);
  const availableBalance = summary?.availableBalance ?? 0;
  const canRequestPayout = Boolean(settlementAccount) && Number(payoutAmount) > 0 && Number(payoutAmount) <= availableBalance;

  const loadSettlementData = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [settlement, bankList] = await Promise.all([
        getFounderSettlementSummary(token),
        listSettlementBanks(token).catch(() => []),
      ]);

      setSummary(settlement.summary);
      setSettlementAccount(settlement.settlementAccount);
      setPayouts(settlement.recentPayouts);
      setBanks(bankList);

      if (settlement.settlementAccount) {
        setBankCode(settlement.settlementAccount.bankCode);
        setBankName(settlement.settlementAccount.bankName);
        setAccountNumber(settlement.settlementAccount.accountNumber);
      } else if (bankList[0]) {
        setBankCode(bankList[0].code);
        setBankName(bankList[0].name);
      }
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Unable to load settlement data.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadSettlementData();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadSettlementData]);

  async function handleVerifyAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsVerifying(true);
    setError("");
    setMessage("");

    try {
      const account = await verifySettlementAccount(
        {
          bankCode,
          bankName: selectedBank?.name ?? bankName,
          accountNumber,
        },
        token,
      );

      setSettlementAccount(account);
      setBankName(account.bankName);
      setAccountNumber(account.accountNumber);
      setMessage(`Settlement account verified for ${account.accountName}.`);
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Unable to verify settlement account.";
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handlePayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const amount = Number(payoutAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount above zero.");
      return;
    }

    if (amount > availableBalance) {
      setError("Withdrawal amount is higher than available revenue.");
      return;
    }

    setIsWithdrawing(true);
    setError("");
    setMessage("");

    try {
      const result = await createFounderPayout({ amount }, token);
      setMessage(`Withdrawal request submitted: ${formatNaira(result.payout.amount)}.`);
      setPayoutAmount("");
      await loadSettlementData();
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Unable to submit withdrawal.";
      setError(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  }

  if (requiresSession) {
    return (
      <>
        <ConsoleHeader
          description="Sign in to connect a bank account and withdraw founder revenue."
          eyebrow="Settlements"
          title="Founder settlements need secure access."
        />
        <Link
          className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
          href="/studio/access"
        >
          Sign in to continue
          <ArrowRight className="size-4" />
        </Link>
      </>
    );
  }

  return (
    <>
      <ConsoleHeader
        action={
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || !session}
            onClick={() => void loadSettlementData()}
            type="button"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          </button>
        }
        description="Withdraw revenue that has already been earned from metered product usage."
        eyebrow="Settlements"
        title="Settle founder revenue."
      />

      {error ? <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-6 rounded-lg bg-mint-50 px-4 py-3 text-sm text-mint-700">{message}</p> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Available" value={formatNaira(availableBalance)} icon={Banknote} tone="yellow" />
        <Metric title="Pending" value={formatNaira(summary?.pendingPayouts ?? 0)} icon={RefreshCw} tone="mint" />
        <Metric title="Paid out" value={formatNaira(summary?.paidOut ?? 0)} icon={CheckCircle2} tone="mint" />
        <Metric title="Gross revenue" value={formatNaira(summary?.totalRevenue ?? 0)} icon={Landmark} tone="ink" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink">Settlement account</h2>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Verify the founder bank account before any withdrawal can be requested.
              </p>
            </div>
            <div className="grid size-10 place-items-center rounded-lg bg-nomba-yellow text-ink">
              <ShieldCheck className="size-5" />
            </div>
          </div>

          {settlementAccount ? (
            <div className="mt-5 rounded-lg border border-mint-100 bg-mint-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mint-700">Verified account</p>
              <p className="mt-3 text-lg font-semibold text-ink">{settlementAccount.accountName}</p>
              <p className="mt-1 text-sm text-graphite">
                {settlementAccount.bankName} / {settlementAccount.accountNumber}
              </p>
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleVerifyAccount}>
            {banks.length > 0 ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Bank</span>
                <select
                  className="input-shell"
                  onChange={(event) => {
                    const bank = banks.find((item) => item.code === event.target.value);
                    setBankCode(event.target.value);
                    setBankName(bank?.name ?? "");
                  }}
                  value={bankCode}
                >
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Bank name</span>
                  <input className="input-shell" onChange={(event) => setBankName(event.target.value)} value={bankName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Bank code</span>
                  <input className="input-shell" onChange={(event) => setBankCode(event.target.value)} value={bankCode} />
                </label>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Account number</span>
              <input
                className="input-shell"
                inputMode="numeric"
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder="0123456789"
                value={accountNumber}
              />
            </label>

            <button
              className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isVerifying || !session}
            >
              {isVerifying ? "Verifying account..." : "Verify settlement account"}
              {isVerifying ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink">Request withdrawal</h2>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Withdraw only revenue already recorded from successful metered actions.
              </p>
            </div>
            <div className="grid size-10 place-items-center rounded-lg bg-ink text-white">
              <Send className="size-5" />
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handlePayout}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Amount</span>
              <div className="flex min-h-12 w-full overflow-hidden rounded-lg border border-ink/10 bg-white text-sm text-ink transition focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
                <span className="flex items-center border-r border-ink/10 bg-paper px-3.5 font-semibold text-graphite">₦</span>
                <input
                  className="min-w-0 flex-1 bg-white px-3.5 py-3 outline-none"
                  inputMode="numeric"
                  min="1"
                  onChange={(event) => setPayoutAmount(event.target.value)}
                  placeholder="5000"
                  type="number"
                  value={payoutAmount}
                />
              </div>
            </label>

            <div className="rounded-lg border border-ink/10 bg-paper p-4 text-sm leading-6 text-graphite">
              Available revenue is locked at request time, so two payout clicks cannot withdraw the same usage revenue.
            </div>

            <button
              className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-nomba-yellow px-4 text-sm font-semibold text-ink transition hover:bg-nomba-gold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isWithdrawing || !canRequestPayout}
            >
              {isWithdrawing ? "Submitting withdrawal..." : "Request withdrawal"}
              {isWithdrawing ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-ink/10 bg-white shadow-line">
        <div className="border-b border-ink/10 p-5">
          <h2 className="text-xl font-semibold text-ink">Payout history</h2>
          <p className="mt-2 text-sm text-graphite">A ledger of settlement attempts and their transfer status.</p>
        </div>

        {payouts.length === 0 ? (
          <div className="p-5 text-sm text-graphite">No withdrawals requested yet.</div>
        ) : (
          <div className="divide-y divide-ink/10">
            {payouts.map((payout) => (
              <div className="grid gap-3 p-5 lg:grid-cols-[1fr_130px_140px_180px] lg:items-center" key={payout.id}>
                <div>
                  <p className="font-semibold text-ink">{payout.accountName}</p>
                  <p className="mt-1 text-sm text-graphite">
                    {payout.bankName} / {payout.accountNumber}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink lg:text-right">{formatNaira(payout.amount)}</p>
                <div className="lg:text-right">
                  <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", payoutTone(payout.status))}>
                    {payout.status}
                  </span>
                </div>
                <p className="text-sm text-graphite lg:text-right">{formatDate(payout.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
