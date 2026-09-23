import { useEffect, useState } from "react";

import { Link, Navigate, useNavigate } from "react-router-dom";

import { Home, LogOut, PiggyBank, TrendingDown, Wallet, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import AIAssistant from "@/components/ui/AIAssistant";
import { Button } from "@/components/ui/Button";
import { PAGE_TITLES, ROUTES } from "@/constants";
import { useAuth } from "@/context/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  type DashboardSummary,
  type Transaction,
  deleteAccount,
  fetchDashboardSummary,
  fetchTransactions,
} from "@/lib/api";

import SavingsProgress from "./components/SavingsProgress";
import SummaryCard from "./components/SummaryCard";
import TransactionTable from "./components/TransactionTable";
import { formatCurrency } from "./format";

export default function Dashboard() {
  usePageTitle(PAGE_TITLES.DASHBOARD);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [transactionsError, setTransactionsError] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    // Ignore a stale response if the user changes while a fetch is in flight.
    let cancelled = false;
    fetchTransactions()
      .then((rows) => {
        if (!cancelled) setTransactions(rows);
      })
      .catch(() => {
        if (!cancelled) setTransactionsError(true);
      });
    fetchDashboardSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummaryError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // A transfer adds a transaction, so reload the list to show it at the top.
  function handleTransferred(updated: DashboardSummary) {
    setSummary(updated);
    fetchTransactions()
      .then((rows) => {
        setTransactions(rows);
        setTransactionsError(false);
      })
      .catch(() => setTransactionsError(true));
  }

  async function handleSignOut() {
    await signOut();
    navigate(ROUTES.LOGIN);
  }

  async function handleDelete() {
    try {
      await deleteAccount();
      await signOut();
      navigate(ROUTES.HOME);
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setConfirming(false);
    }
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "there";
  // "—" while the summary is loading, or if it failed to load.
  let balance = "—";
  let monthlySpending = "—";
  let savings = "—";
  if (summary) {
    balance = formatCurrency(summary.balance);
    monthlySpending = formatCurrency(summary.monthly_spending);
    savings =
      summary.savings_goal > 0
        ? `${formatCurrency(summary.savings_saved)} / ${formatCurrency(summary.savings_goal)}`
        : "No goal set";
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-fg">
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-xs md:text-sm fixed left-6 bottom-6 right-24 sm:right-auto rounded-xl border border-white/10 bg-black/60 backdrop-blur-md text-brand-fg-muted px-4 py-3 pr-8 z-50"
          >
            <p>This is a demo project. All data is simulated.</p>
            <button
              className="absolute top-2 right-2 cursor-pointer hover:text-brand-fg transition-colors"
              onClick={() => setShowBanner(false)}
              aria-label="Dismiss banner"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        {/* Welcome */}
        <motion.div {...scrollAnimation} className="flex items-start justify-between">
          <div>
            <p className="text-brand-fg-muted text-sm mb-1">Good to see you back</p>
            <h1 className="text-3xl font-bold text-brand-fg">{displayName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 text-sm text-brand-fg-muted hover:text-brand-fg transition-colors"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-brand-fg-muted hover:text-brand-fg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </motion.div>

        {/* Summary cards */}
        {summaryError && (
          <p className="text-sm text-brand-error">Couldn't load your account summary.</p>
        )}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: Wallet,
              label: "Account Balance",
              value: balance,
            },
            {
              icon: TrendingDown,
              label: "Monthly Spending",
              value: monthlySpending,
            },
            {
              icon: PiggyBank,
              label: "Savings Goal",
              value: savings,
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, ease: "easeOut" },
                },
              }}
            >
              <SummaryCard icon={card.icon} label={card.label} value={card.value} />
            </motion.div>
          ))}
        </motion.div>

        {/* Savings progress bar */}
        <SavingsProgress
          summary={summary}
          onGoalSaved={setSummary}
          onTransferred={handleTransferred}
        />

        {/* Recent transactions */}
        <div className="space-y-4">
          <motion.h2 {...scrollAnimation} className="text-lg font-semibold text-brand-fg">
            Recent Transactions
          </motion.h2>
          <TransactionTable transactions={transactions} error={transactionsError} />
        </div>
        {/* Danger zone */}
        <motion.div
          {...scrollAnimation}
          className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-5"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">
            Danger zone
          </p>
          <p className="text-sm text-brand-fg-muted mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          {deleteError && <p className="text-red-400 text-sm mb-4">{deleteError}</p>}
          {!confirming ? (
            <Button
              variant="danger"
              onClick={() => {
                setConfirming(true);
                setDeleteError("");
              }}
            >
              Delete account
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="dangerSolid" onClick={handleDelete}>
                Yes, delete permanently
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <AIAssistant />
    </div>
  );
}
