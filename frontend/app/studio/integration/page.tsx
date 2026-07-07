"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy,
  KeyRound,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ContractStrip } from "@/components/ContractStrip";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import { createFounderApiKey, listFounderApiKeys, revokeFounderApiKey } from "@/lib/api/paymeter-client";
import { getApiBaseUrl, getApiMode, type ApiKeyRecord, type CreateApiKeyResponse } from "@/lib/api/contracts";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function maskPrefix(prefix: string) {
  return `${prefix}${prefix.endsWith("_") ? "" : "..."}********`;
}

function isApiKeyStorageSetupError(message: string) {
  return /api-key storage|api_keys|schema cache|005_api_keys/i.test(message);
}

export default function ConsoleIntegrationPage() {
  const { session, isLiveMode } = useConsoleData();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [keyName, setKeyName] = useState("CaptionPilot server key");
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const token = session?.token ?? null;
  const canManageKeys = !isLiveMode || Boolean(token);
  const apiBaseUrl = getApiBaseUrl() || "https://paymeter.onrender.com";
  const hasStorageSetupIssue = isApiKeyStorageSetupError(error);

  const meterSnippet = useMemo(
    () => `const meter = await fetch("${apiBaseUrl}/api/meter", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.PAYMETER_API_KEY
  },
  body: JSON.stringify({
    userId: "captionpilot_user_001",
    featureName: "Caption Generation",
    founderId: "${session?.founder.id ?? "<founder_id>"}"
  })
});

const result = await meter.json();

if (!result.success || !result.data.allowed) {
  return { status: "payment_required" };
}

// Run the paid product action only after PayMeter allows it.`,
    [apiBaseUrl, session?.founder.id],
  );

  const loadKeys = useCallback(async () => {
    if (!canManageKeys) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const nextKeys = await listFounderApiKeys(token);
      setKeys(nextKeys);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not load API keys.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [canManageKeys, token]);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const createKey = async () => {
    const trimmedName = keyName.trim();

    if (!trimmedName) {
      setError("Give this key a clear name, like CaptionPilot production.");
      return;
    }

    setIsCreating(true);
    setError("");
    setNotice("");
    setCopied(false);

    try {
      const nextKey = await createFounderApiKey({ name: trimmedName }, token);
      setCreatedKey(nextKey);
      setKeys((current) => [nextKey, ...current.filter((item) => item.id !== nextKey.id)]);
      setNotice("API key created. Copy the secret now; it will not be shown again.");
      setKeyName("");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not create API key.";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const copySecret = async () => {
    if (!createdKey?.apiKey) {
      return;
    }

    await navigator.clipboard.writeText(createdKey.apiKey);
    setCopied(true);
    setNotice("Secret copied. Store it in the founder app backend environment.");
  };

  const revokeKey = async (apiKeyId: string) => {
    setRevokingId(apiKeyId);
    setError("");
    setNotice("");

    try {
      await revokeFounderApiKey(apiKeyId, token);
      setKeys((current) => current.filter((item) => item.id !== apiKeyId));

      if (createdKey?.id === apiKeyId) {
        setCreatedKey(null);
      }

      setNotice("API key revoked. Requests using that key will be rejected.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not revoke API key.";
      setError(message);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <>
      <ConsoleHeader
        action={
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
            href="/docs"
            target="_blank"
          >
            Open docs
            <ArrowRight className="size-4" />
          </Link>
        }
        description="Generate server-side credentials, connect founder apps to the meter, and keep paid actions behind a clear balance check."
        eyebrow="API keys"
        title="Connect your product backend to PayMeter."
      />

      {error ? (
        <div
          className={
            hasStorageSetupIssue
              ? "mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              : "mt-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {hasStorageSetupIssue
            ? "API-key storage is not ready on the deployed Supabase database. Run backend/supabase/migrations/005_api_keys.sql, then refresh this page."
            : error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-6 rounded-lg border border-mint-100 bg-mint-50 px-4 py-3 text-sm text-mint-800">{notice}</div>
      ) : null}

      {!canManageKeys ? (
        <section className="mt-6 rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Sign in to manage API keys.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-graphite">
                Keys belong to a founder workspace, so they can be revoked without touching customer data.
              </p>
            </div>
            <Link
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon"
              href="/studio/access"
            >
              Enter Studio
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-6 grid gap-5 xl:grid-cols-[440px_1fr]">
          <div className="space-y-5">
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-5 text-nomba-gold" />
                    <h2 className="text-xl font-semibold text-ink">Create an API key</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-graphite">
                    Use one key per server or environment so a compromised integration can be revoked quickly.
                  </p>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-graphite">{getApiMode()}</span>
              </div>

              <label className="mt-5 block text-sm font-semibold text-ink" htmlFor="api-key-name">
                Key name
              </label>
              <input
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-ink/10 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-graphite/45"
                id="api-key-name"
                onChange={(event) => setKeyName(event.target.value)}
                placeholder="CaptionPilot production"
                value={keyName}
              />

              <button
                className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isCreating || hasStorageSetupIssue}
                onClick={createKey}
                type="button"
              >
                {isCreating ? "Creating key..." : "Generate server key"}
                <ArrowRight className="size-4" />
              </button>
            </article>

            {createdKey ? (
              <article className="rounded-lg border border-nomba-yellow/45 bg-ink p-5 text-white shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-nomba-yellow text-ink">
                    <LockKeyhole className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Copy this secret now</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      PayMeter stores only a hash. After you leave this page, the full key cannot be recovered.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.05] p-3">
                  <code className="break-all text-xs leading-6 text-nomba-yellow">{createdKey.apiKey}</code>
                </div>

                <button
                  className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-ink transition hover:bg-nomba-yellow"
                  onClick={copySecret}
                  type="button"
                >
                  {copied ? "Copied" : "Copy secret"}
                  {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                </button>
              </article>
            ) : null}
          </div>

          <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
            <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ServerCog className="size-5 text-mint-700" />
                  <h2 className="text-xl font-semibold text-ink">Active integration keys</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-graphite">
                  Key secrets are never listed again. Studio shows names, prefixes, and revoke controls.
                </p>
              </div>
              <button
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-semibold text-ink transition hover:bg-paper disabled:opacity-55"
                disabled={isLoading}
                onClick={() => void loadKeys()}
                type="button"
              >
                Refresh
                <Clipboard className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {hasStorageSetupIssue ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                  <p className="font-semibold">Production database setup needed</p>
                  <p className="mt-2">
                    The API routes are deployed, but Supabase does not have the `api_keys` table available yet. After the
                    migration runs, use Refresh here and key creation will unlock.
                  </p>
                </div>
              ) : keys.length === 0 ? (
                <div className="rounded-lg border border-dashed border-ink/15 bg-paper p-5 text-sm leading-6 text-graphite">
                  No API keys yet. Generate one when the founder app backend is ready to call PayMeter.
                </div>
              ) : (
                keys.map((apiKey) => (
                  <div
                    className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
                    key={apiKey.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">{apiKey.name}</p>
                        <span className="rounded-full bg-mint-50 px-2.5 py-1 text-[11px] font-bold text-mint-700">
                          {apiKey.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-xs text-graphite">{maskPrefix(apiKey.keyPrefix)}</p>
                      <p className="mt-1 text-xs text-graphite/70">Created {formatDate(apiKey.createdAt)}</p>
                    </div>

                    <button
                      className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-100 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-55"
                      disabled={revokingId === apiKey.id}
                      onClick={() => void revokeKey(apiKey.id)}
                      type="button"
                    >
                      {revokingId === apiKey.id ? "Revoking..." : "Revoke"}
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      )}

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_420px]">
        <article className="rounded-lg border border-ink/10 bg-ink p-5 text-white shadow-soft">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Code2 className="size-4 text-nomba-yellow" />
            Backend meter call
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-white/72">
            <code>{meterSnippet}</code>
          </pre>
        </article>

        <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="grid size-10 place-items-center rounded-lg bg-mint-50 text-mint-700">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">Production rule</h2>
          <p className="mt-3 text-sm leading-6 text-graphite">
            Founder API keys should live in the founder app backend as environment variables. The customer app should call
            its own backend, and that backend should call PayMeter before returning a paid result.
          </p>
          <div className="mt-5 rounded-lg border border-ink/10 bg-paper p-4 text-sm leading-6 text-graphite">
            <p className="font-semibold text-ink">Accepted headers</p>
            <p className="mt-2 font-mono text-xs">x-api-key: pm_live_...</p>
            <p className="mt-1 font-mono text-xs">Authorization: Bearer pm_live_...</p>
          </div>
        </article>
      </section>

      <div className="mt-6">
        <ContractStrip />
      </div>
    </>
  );
}
