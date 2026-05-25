import { AMOUNT_MIN, AMOUNT_MAX, TERMS, type Term } from "../loans.data";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface Props {
  amount: number;
  term: Term;
  onAmountChange: (amount: number) => void;
  onTermChange: (term: Term) => void;
}

export function LoanConfiguratorCard({
  amount,
  term,
  onAmountChange,
  onTermChange,
}: Props) {
  const pct = ((amount - AMOUNT_MIN) / (AMOUNT_MAX - AMOUNT_MIN)) * 100;

  return (
    <div className="w-full lg:w-[420px] bg-brand-surface border border-brand-border rounded-2xl p-6">
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <label className="text-sm font-medium text-brand-fg-muted uppercase tracking-wider">
            Loan amount
          </label>
          <span className="text-2xl font-bold text-brand-accent">
            {fmt.format(amount)}
          </span>
        </div>
        <input
          type="range"
          min={AMOUNT_MIN}
          max={AMOUNT_MAX}
          step={1_000}
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-brand-accent) ${pct}%, var(--color-brand-border) ${pct}%)`,
          }}
        />
        <div className="flex justify-between mt-1.5 text-xs text-brand-fg-muted">
          <span>{fmt.format(AMOUNT_MIN)}</span>
          <span>{fmt.format(AMOUNT_MAX)}</span>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-brand-fg-muted uppercase tracking-wider mb-3">
          Loan term
        </p>
        <div className="flex gap-2 flex-wrap">
          {TERMS.map((t) => (
            <button
              key={t}
              onClick={() => onTermChange(t)}
              className={`flex-1 min-w-[48px] py-2 rounded-xl text-sm font-medium border transition-colors ${
                t === term
                  ? "bg-brand-accent text-brand-bg border-brand-accent"
                  : "bg-transparent text-brand-fg-muted border-brand-border hover:border-brand-accent/50 hover:text-brand-fg"
              }`}
            >
              {t}mo
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
