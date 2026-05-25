import { useState } from "react";
import { motion } from "motion/react";
import { Wallet, TrendingDown, PiggyBank, LogOut, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/context/useAuth";
import { PAGE_TITLES, ROUTES } from "@/constants";
import { scrollAnimation } from "@/animations";
import AIAssistant from "@/components/ui/AIAssistant";
import { Button } from "@/components/ui/Button";
import SummaryCard from "./components/SummaryCard";
import TransactionTable from "./components/TransactionTable";
import { seedFromUserId } from "./Dashboard.data";
import { deleteAccount } from "@/lib/api";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function Dashboard() {
  usePageTitle(PAGE_TITLES.DASHBOARD);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

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
      console.error("Failed to delete account");
    }
  }

  const { summary, transactions } = seedFromUserId(user!.id);
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "there";
  const savingsPct = Math.round(
    (summary.savingsProgress / summary.savingsGoal) * 100,
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-fg">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        {/* Welcome */}
        <motion.div
          {...scrollAnimation}
          className="flex items-start justify-between"
        >
          <div>
            <p className="text-brand-fg-muted text-sm mb-1">
              Good to see you back
            </p>
            <h1 className="text-3xl font-bold text-brand-fg">{displayName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 text-sm text-brand-fg-muted hover:text-brand-fg transition-colors"
            >
              <Home size={16} />
              Home
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-brand-fg-muted hover:text-brand-fg transition-colors"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </motion.div>

        {/* Summary cards */}
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
              value: formatCurrency(summary.accountBalance),
            },
            {
              icon: TrendingDown,
              label: "Monthly Spending",
              value: formatCurrency(summary.monthlySpending),
            },
            {
              icon: PiggyBank,
              label: "Savings Goal",
              value: `${formatCurrency(summary.savingsProgress)} / ${formatCurrency(summary.savingsGoal)}`,
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
              <SummaryCard
                icon={card.icon}
                label={card.label}
                value={card.value}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Savings progress bar */}
        <motion.div
          {...scrollAnimation}
          className="rounded-2xl bg-brand-surface px-6 py-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-brand-fg">
              Savings progress
            </p>
            <p className="text-sm font-semibold text-brand-accent">
              {savingsPct}%
            </p>
          </div>
          <div className="h-2 rounded-full bg-brand-bg overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-brand-accent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: savingsPct / 100 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
            />
          </div>
        </motion.div>

        {/* Recent transactions */}
        <div className="space-y-4">
          <motion.h2
            {...scrollAnimation}
            className="text-lg font-semibold text-brand-fg"
          >
            Recent Transactions
          </motion.h2>
          <TransactionTable transactions={transactions} />
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
            Permanently delete your account and all associated data. This cannot
            be undone.
          </p>
          {!confirming ? (
            <Button variant="danger" onClick={() => setConfirming(true)}>
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
