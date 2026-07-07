"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Pencil, Plus, ToggleLeft, ToggleRight, X } from "lucide-react";
import clsx from "clsx";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { useConsoleData } from "@/components/console/ConsoleDataProvider";
import { compactNumber, formatNaira } from "@/lib/format";
import type { BillableFeature } from "@/lib/types";

function PriceInput({
  className,
  onChange,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div
      className={clsx(
        "flex min-h-12 w-full overflow-hidden rounded-lg border border-ink/10 bg-white text-sm text-ink transition focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10",
        className,
      )}
    >
      <span className="flex items-center border-r border-ink/10 bg-paper px-3.5 font-semibold text-graphite">₦</span>
      <input
        className="min-w-0 flex-1 bg-white px-3.5 py-3 outline-none"
        inputMode="numeric"
        min="1"
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
    </div>
  );
}

export default function ConsoleFeaturesPage() {
  const { error, features, isLiveMode, session, createFeature, updateFeature, toggleFeature } = useConsoleData();
  const [featureName, setFeatureName] = useState("");
  const [featurePrice, setFeaturePrice] = useState("50");
  const [featureError, setFeatureError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", price: "" });

  async function handleCreateFeature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeatureError("");

    const price = Number(featurePrice);

    if (!featureName.trim()) {
      setFeatureError("Feature name cannot be empty.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFeatureError("Price must be a valid amount above zero.");
      return;
    }

    try {
      setIsCreating(true);
      await createFeature({ name: featureName, price });
      setFeatureName("");
      setFeaturePrice("50");
    } catch {
      setFeatureError("Could not create feature. Check your Studio session and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(feature: BillableFeature) {
    setEditingId(feature.id);
    setEditDraft({ name: feature.name, price: String(feature.price) });
  }

  async function saveEdit(featureId: string) {
    const price = Number(editDraft.price);

    if (!editDraft.name.trim() || !Number.isFinite(price) || price <= 0) {
      setFeatureError("Feature edits need a name and a price above zero.");
      return;
    }

    try {
      await updateFeature(featureId, { name: editDraft.name, price });
      setEditingId(null);
    } catch {
      setFeatureError("Could not save feature changes.");
    }
  }

  async function handleToggle(featureId: string) {
    try {
      await toggleFeature(featureId);
    } catch {
      setFeatureError("Could not change feature status.");
    }
  }

  const requiresSession = isLiveMode && !session;

  return (
    <>
      <ConsoleHeader
        description="Create the actions customers will pay for, set a clear naira price, and pause access without losing history."
        eyebrow="Feature pricing"
        title="Create and manage billable features."
      />

      {error ? <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink">New paid action</h2>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Choose one product action, then set the amount customers pay each time it runs.
              </p>
            </div>
            <div className="grid size-10 place-items-center rounded-lg bg-nomba-yellow text-ink">
              <Plus className="size-5" />
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreateFeature}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Feature name</span>
              <input
                className="input-shell"
                onChange={(event) => setFeatureName(event.target.value)}
                placeholder="Caption Generation"
                value={featureName}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Price per use</span>
              <PriceInput onChange={setFeaturePrice} value={featurePrice} />
            </label>

            {featureError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{featureError}</p> : null}

            <button
              className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-carbon disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreating || requiresSession}
            >
              {requiresSession ? "Sign in to create features" : isCreating ? "Creating feature..." : "Create feature"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white shadow-line">
          <div className="flex flex-col gap-3 border-b border-ink/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Feature ledger</h2>
              <p className="mt-2 text-sm text-graphite">Edit pricing without deleting historical usage.</p>
            </div>
            <span className="rounded-full bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700">
              {features.length} configured
            </span>
          </div>

          <div className="divide-y divide-ink/10">
            {features.length === 0 ? (
              <div className="p-5 text-sm text-graphite">
                No billable features yet. Create the first paid action to start metering customer usage.
              </div>
            ) : (
              features.map((feature) => {
              const revenue = feature.price * feature.usageCount;
              const isEditing = editingId === feature.id;

              return (
                <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.7fr_0.75fr_auto] lg:items-center" key={feature.id}>
                  <div>
                    {isEditing ? (
                      <input
                        className="input-shell"
                        onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))}
                        value={editDraft.name}
                      />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{feature.name}</p>
                          <span
                            className={clsx(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              feature.active ? "bg-mint-50 text-mint-700" : "bg-ink/5 text-graphite",
                            )}
                          >
                            {feature.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-graphite">{compactNumber(feature.usageCount)} paid attempts</p>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Price</p>
                    {isEditing ? (
                      <PriceInput
                        className="mt-2"
                        onChange={(price) => setEditDraft((current) => ({ ...current, price }))}
                        value={editDraft.price}
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-ink">{formatNaira(feature.price)}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Revenue</p>
                    <p className="mt-1 font-semibold text-ink">{formatNaira(revenue)}</p>
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end">
                    {isEditing ? (
                      <>
                        <button
                          aria-label="Save feature"
                          className="focus-ring grid size-10 place-items-center rounded-lg bg-ink text-white transition hover:bg-carbon"
                          onClick={() => saveEdit(feature.id)}
                          type="button"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          aria-label="Cancel edit"
                          className="focus-ring grid size-10 place-items-center rounded-lg border border-ink/10 text-graphite transition hover:bg-ink/5 hover:text-ink"
                          onClick={() => setEditingId(null)}
                          type="button"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          aria-label={`Edit ${feature.name}`}
                          className="focus-ring grid size-10 place-items-center rounded-lg border border-ink/10 text-graphite transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
                          disabled={requiresSession}
                          onClick={() => startEditing(feature)}
                          type="button"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          aria-label={feature.active ? `Deactivate ${feature.name}` : `Activate ${feature.name}`}
                          className="focus-ring grid size-10 place-items-center rounded-lg border border-ink/10 text-graphite transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
                          disabled={requiresSession}
                          onClick={() => handleToggle(feature.id)}
                          type="button"
                        >
                          {feature.active ? <ToggleRight className="size-5 text-mint-700" /> : <ToggleLeft className="size-5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      </section>
    </>
  );
}
