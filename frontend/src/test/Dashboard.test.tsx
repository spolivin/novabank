import React from "react";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/useAuth";
import { deleteAccount, fetchDashboardSummary, fetchTransactions } from "@/lib/api";
import Dashboard from "@/pages/Dashboard";

const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "layout",
  "layoutId",
]);

// Cache one component per tag: a fresh function on every access would be a new
// component type on each render, remounting the DOM whenever the dashboard re-renders
// (e.g. when transactions arrive), so clicks could land on a detached node.
vi.mock("motion/react", () => {
  type MockProps = React.HTMLAttributes<HTMLElement> & Record<string, unknown>;
  const cache = new Map<string, React.FC<MockProps>>();
  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(tag, ({ children, ...props }: MockProps) => {
            const domProps = Object.fromEntries(
              Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k))
            );
            return React.createElement(tag, domProps, children);
          });
        }
        return cache.get(tag);
      },
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@/context/useAuth");
vi.mock("@/lib/api");
vi.mock("@/components/ui/AIAssistant", () => ({ default: () => null }));

const mockUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "user@test.com",
  user_metadata: { full_name: "Jane Doe" },
};

// Async: the dashboard fetches transactions on mount, and the mocked fetch settles on
// a later microtask. Flushing it inside act() keeps that state update from landing
// after the test's assertions (React's "not wrapped in act(...)" warning).
async function renderDashboard(user: typeof mockUser | null = mockUser) {
  const signOut = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: !!user,
    loading: false,
    user: user as never,
    signOut,
  });
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>
  );
  await act(async () => {});
  return { signOut };
}

const summary = {
  balance: 8412.55,
  monthly_spending: 1734.2,
  savings_goal: 10000,
  savings_saved: 2500,
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.mocked(fetchTransactions).mockReset().mockResolvedValue([]);
    vi.mocked(fetchDashboardSummary).mockReset().mockResolvedValue(summary);
  });

  it("redirects to login when user is null", async () => {
    await renderDashboard(null);
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders the user display name", async () => {
    await renderDashboard();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders summary card labels", async () => {
    await renderDashboard();
    expect(screen.getByText(/account balance/i)).toBeInTheDocument();
    expect(screen.getByText(/monthly spending/i)).toBeInTheDocument();
    expect(screen.getByText(/savings goal/i)).toBeInTheDocument();
  });

  it("renders summary figures fetched from the API", async () => {
    await renderDashboard();
    expect(screen.getByText("$8,413")).toBeInTheDocument();
    expect(screen.getByText("$1,734")).toBeInTheDocument();
    expect(screen.getByText("$2,500 / $10,000")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(fetchDashboardSummary).toHaveBeenCalledOnce();
  });

  it("shows 'No goal set' when the user has no savings goal", async () => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue({ ...summary, savings_goal: 0 });
    await renderDashboard();
    expect(screen.getByText("No goal set")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set goal/i })).toBeInTheDocument();
  });

  it("shows placeholders and an error when the summary fails to load", async () => {
    vi.mocked(fetchDashboardSummary).mockRejectedValue(new Error("server error"));
    await renderDashboard();
    expect(screen.getByText(/couldn't load your account summary/i)).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("renders the recent transactions section", async () => {
    await renderDashboard();
    expect(screen.getByText(/recent transactions/i)).toBeInTheDocument();
  });

  it("renders transactions fetched from the API", async () => {
    vi.mocked(fetchTransactions).mockResolvedValue([
      {
        id: "tx-1",
        date: "2026-09-12",
        description: "Salary deposit",
        category: "Income",
        amount: 5200,
      },
    ]);
    await renderDashboard();
    expect(await screen.findByText("Salary deposit")).toBeInTheDocument();
    expect(fetchTransactions).toHaveBeenCalledOnce();
  });

  it("shows the empty state when the user has no transactions", async () => {
    await renderDashboard();
    expect(await screen.findByText("No transactions found")).toBeInTheDocument();
  });

  it("shows an error when fetching transactions fails", async () => {
    vi.mocked(fetchTransactions).mockRejectedValue(new Error("server error"));
    await renderDashboard();
    expect(await screen.findByText(/couldn't load transactions/i)).toBeInTheDocument();
  });

  it("does not fetch dashboard data when there is no user", async () => {
    await renderDashboard(null);
    expect(fetchTransactions).not.toHaveBeenCalled();
    expect(fetchDashboardSummary).not.toHaveBeenCalled();
  });

  it("shows the initial delete button, not the confirm dialog", async () => {
    await renderDashboard();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /yes, delete permanently/i })
    ).not.toBeInTheDocument();
  });

  it("shows confirm and cancel buttons after clicking delete account", async () => {
    await renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(screen.getByRole("button", { name: /yes, delete permanently/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("hides the confirm dialog when cancel is clicked", async () => {
    await renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("button", { name: /yes, delete permanently/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("calls deleteAccount and navigates home on confirmed delete", async () => {
    vi.mocked(deleteAccount).mockResolvedValue(undefined);
    const { signOut } = await renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await userEvent.click(screen.getByRole("button", { name: /yes, delete permanently/i }));
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledOnce());
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText("Home page")).toBeInTheDocument());
  });

  it("shows error message and restores delete button when deleteAccount fails", async () => {
    vi.mocked(deleteAccount).mockRejectedValue(new Error("server error"));
    await renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await userEvent.click(screen.getByRole("button", { name: /yes, delete permanently/i }));
    expect(await screen.findByText(/failed to delete account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("signs out and navigates to login on log out click", async () => {
    const { signOut } = await renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
  });
});
