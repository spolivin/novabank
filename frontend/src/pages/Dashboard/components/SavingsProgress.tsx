import { type FormEvent, useState } from "react";

import { Pencil } from "lucide-react";
import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { type DashboardSummary, updateSavingsGoal } from "@/lib/api";

export const MAX_SAVINGS_GOAL = 10_000_000;

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

interface SavingsProgressProps {
  /** `null` while the summary is loading or failed to load. */
  summary: DashboardSummary | null;
  onGoalSaved: (summary: DashboardSummary) => void;
}

export default function SavingsProgress({ summary, onGoalSaved }: SavingsProgressProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const goal = summary?.savings_goal ?? 0;
  const saved = summary?.savings_saved ?? 0;
  const pct = goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0;

  function startEditing() {
    setDraft(goal > 0 ? String(goal) : "");
    setError("");
    setEditing(true);
  }

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
      onGoalSaved(await updateSavingsGoal(value));
      setEditing(false);
    } catch {
      setError("Couldn't save your goal. Try again?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div {...scrollAnimation} className="rounded-2xl bg-brand-surface px-6 py-5">
      <div className="flex items-center justify-between mb-3 gap-4">
        <p className="text-sm font-medium text-brand-fg">Savings progress</p>
        <div className="flex items-center gap-3">
          {goal > 0 && <p className="text-sm font-semibold text-brand-accent">{pct}%</p>}
          {summary && !editing && (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 text-xs text-brand-fg-muted hover:text-brand-fg transition-colors"
            >
              <Pencil size={12} />
              {goal > 0 ? "Edit goal" : "Set goal"}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
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
            onClick={() => setEditing(false)}
            disabled={saving}
            className="text-sm text-brand-fg-muted hover:text-brand-fg transition-colors"
          >
            Cancel
          </button>
        </form>
      ) : goal > 0 ? (
        <div className="h-2 rounded-full bg-brand-bg overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-brand-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: pct / 100 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      ) : (
        summary && (
          <p className="text-sm text-brand-fg-muted">Set a savings goal to track your progress.</p>
        )
      )}

      {error && <p className="text-sm text-brand-error mt-3">{error}</p>}
    </motion.div>
  );
}
