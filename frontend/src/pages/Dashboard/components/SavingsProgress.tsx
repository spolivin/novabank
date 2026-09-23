import { useState } from "react";

import { ArrowLeftRight, Pencil } from "lucide-react";
import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import type { DashboardSummary } from "@/lib/api";

import GoalForm from "./GoalForm";
import TransferForm from "./TransferForm";

interface SavingsProgressProps {
  /** `null` while the summary is loading or failed to load. */
  summary: DashboardSummary | null;
  onGoalSaved: (summary: DashboardSummary) => void;
  onTransferred: (summary: DashboardSummary) => void;
}

type Mode = "view" | "goal" | "transfer";

const actionClass =
  "flex items-center gap-1.5 text-xs text-brand-fg-muted hover:text-brand-fg transition-colors";

export default function SavingsProgress({
  summary,
  onGoalSaved,
  onTransferred,
}: SavingsProgressProps) {
  const [mode, setMode] = useState<Mode>("view");

  const goal = summary?.savings_goal ?? 0;
  const saved = summary?.savings_saved ?? 0;
  const pct = goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0;

  let body;
  if (summary && mode === "goal") {
    body = (
      <GoalForm
        goal={goal}
        onSaved={(updated) => {
          onGoalSaved(updated);
          setMode("view");
        }}
        onCancel={() => setMode("view")}
      />
    );
  } else if (summary && mode === "transfer") {
    body = (
      <TransferForm
        summary={summary}
        onTransferred={(updated) => {
          onTransferred(updated);
          setMode("view");
        }}
        onCancel={() => setMode("view")}
      />
    );
  } else if (goal > 0) {
    body = (
      <div className="h-2 rounded-full bg-brand-bg overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-brand-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: "left" }}
        />
      </div>
    );
  } else if (summary) {
    body = (
      <p className="text-sm text-brand-fg-muted">Set a savings goal to track your progress.</p>
    );
  }

  return (
    <motion.div {...scrollAnimation} className="rounded-2xl bg-brand-surface px-6 py-5">
      <div className="flex items-center justify-between mb-3 gap-4">
        <p className="text-sm font-medium text-brand-fg">Savings progress</p>
        <div className="flex items-center gap-4">
          {goal > 0 && <p className="text-sm font-semibold text-brand-accent">{pct}%</p>}
          {summary && mode === "view" && (
            <>
              <button onClick={() => setMode("transfer")} className={actionClass}>
                <ArrowLeftRight size={12} />
                Move money
              </button>
              <button onClick={() => setMode("goal")} className={actionClass}>
                <Pencil size={12} />
                {goal > 0 ? "Edit goal" : "Set goal"}
              </button>
            </>
          )}
        </div>
      </div>
      {body}
    </motion.div>
  );
}
