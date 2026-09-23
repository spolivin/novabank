import { type FormEvent, useState } from "react";

import { type DashboardSummary, updateSavingsGoal } from "@/lib/api";

import { formatCurrency } from "../format";

export const MAX_SAVINGS_GOAL = 10_000_000;

interface GoalFormProps {
  /** The current goal; `0` when none is set. */
  goal: number;
  onSaved: (summary: DashboardSummary) => void;
  onCancel: () => void;
}

export default function GoalForm({ goal, onSaved, onCancel }: GoalFormProps) {
  const [draft, setDraft] = useState(goal > 0 ? String(goal) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(draft);
    if (!Number.isFinite(value) || value <= 0 || value > MAX_SAVINGS_GOAL) {
      setError(`Enter an amount above $0, up to ${formatCurrency(MAX_SAVINGS_GOAL)}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      onSaved(await updateSavingsGoal(value));
    } catch {
      setError("Couldn't save your goal. Try again?");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="savings-goal" className="sr-only">
          Savings goal in dollars
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-fg-muted">
            $
          </span>
          <input
            id="savings-goal"
            type="number"
            inputMode="decimal"
            min={0.01}
            max={MAX_SAVINGS_GOAL}
            step="0.01"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-40 rounded-lg bg-brand-bg border border-white/10 pl-7 pr-3 py-2 text-sm text-brand-fg focus:outline-none focus:border-brand-accent"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-accent text-brand-bg text-sm font-semibold px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-sm text-brand-fg-muted hover:text-brand-fg transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-brand-error mt-3">{error}</p>}
    </form>
  );
}
