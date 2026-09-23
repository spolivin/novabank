import { type FormEvent, useState } from "react";

import { type DashboardSummary, type TransferDirection, transferSavings } from "@/lib/api";

import { formatCurrency } from "../format";

// Whole dollars with up to two decimal places, e.g. "250" or "250.5" or "250.75".
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

const DIRECTIONS: { value: TransferDirection; label: string }[] = [
  { value: "to_savings", label: "To savings" },
  { value: "from_savings", label: "From savings" },
];

interface TransferFormProps {
  summary: DashboardSummary;
  onTransferred: (summary: DashboardSummary) => void;
  onCancel: () => void;
}

export default function TransferForm({ summary, onTransferred, onCancel }: TransferFormProps) {
  const [direction, setDirection] = useState<TransferDirection>("to_savings");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const available = Math.max(
    0,
    direction === "to_savings" ? summary.balance : summary.savings_saved
  );

  function chooseDirection(value: TransferDirection) {
    setDirection(value);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(draft);
    if (!AMOUNT_PATTERN.test(draft.trim()) || value <= 0) {
      setError("Enter an amount above $0, in dollars and cents.");
      return;
    }
    // Compare in cents so float rounding can't reject moving the exact amount available.
    if (Math.round(value * 100) > Math.round(available * 100)) {
      setError(`You can move up to ${formatCurrency(available, 2)}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      onTransferred(await transferSavings(direction, value));
    } catch (err) {
      setError(
        err instanceof Error && err.message === "insufficient_funds"
          ? "Not enough funds for this transfer."
          : "Couldn't move funds. Try again?"
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div
        role="group"
        aria-label="Transfer direction"
        className="inline-flex rounded-lg bg-brand-bg p-1"
      >
        {DIRECTIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            aria-pressed={direction === d.value}
            onClick={() => chooseDirection(d.value)}
            disabled={saving}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              direction === d.value
                ? "bg-brand-accent text-brand-bg"
                : "text-brand-fg-muted hover:text-brand-fg"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="transfer-amount" className="sr-only">
          Amount to move in dollars
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-fg-muted">
            $
          </span>
          <input
            id="transfer-amount"
            type="number"
            inputMode="decimal"
            min={0.01}
            step="0.01"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-40 rounded-lg bg-brand-bg border border-white/10 pl-7 pr-3 py-2 text-sm text-brand-fg focus:outline-none focus:border-brand-accent"
          />
        </div>
        <button
          type="submit"
          disabled={saving || available <= 0}
          className="rounded-lg bg-brand-accent text-brand-bg text-sm font-semibold px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Moving…" : "Move"}
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

      <p className="text-xs text-brand-fg-muted">
        {available > 0
          ? `Available: ${formatCurrency(available, 2)}`
          : direction === "to_savings"
            ? "No funds available in your account."
            : "Nothing in savings yet."}
      </p>
      {error && <p className="text-sm text-brand-error">{error}</p>}
    </form>
  );
}
