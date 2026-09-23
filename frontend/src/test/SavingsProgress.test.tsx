import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transferSavings, updateSavingsGoal } from "@/lib/api";
import SavingsProgress from "@/pages/Dashboard/components/SavingsProgress";

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

// One component per tag, so re-renders while typing don't remount the DOM.
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
  };
});

vi.mock("@/lib/api");

const withGoal = { balance: 5000, monthly_spending: 800, savings_goal: 10000, savings_saved: 2500 };
const noGoal = { ...withGoal, savings_goal: 0 };

describe("SavingsProgress", () => {
  beforeEach(() => {
    vi.mocked(updateSavingsGoal).mockReset();
    vi.mocked(transferSavings).mockReset();
  });

  it("shows the percentage of the goal saved", () => {
    render(<SavingsProgress summary={withGoal} onGoalSaved={vi.fn()} onTransferred={vi.fn()} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit goal/i })).toBeInTheDocument();
  });

  it("caps the percentage at 100", () => {
    render(
      <SavingsProgress
        summary={{ ...withGoal, savings_saved: 25000 }}
        onGoalSaved={vi.fn()}
        onTransferred={vi.fn()}
      />
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("prompts to set a goal when none is set", () => {
    render(<SavingsProgress summary={noGoal} onGoalSaved={vi.fn()} onTransferred={vi.fn()} />);
    expect(screen.getByText(/set a savings goal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set goal/i })).toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it("hides the edit button until the summary has loaded", () => {
    render(<SavingsProgress summary={null} onGoalSaved={vi.fn()} onTransferred={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /goal/i })).not.toBeInTheDocument();
  });

  it("saves a new goal and passes the refreshed summary up", async () => {
    const refreshed = { ...withGoal, savings_goal: 5000 };
    vi.mocked(updateSavingsGoal).mockResolvedValue(refreshed);
    const onGoalSaved = vi.fn();
    render(
      <SavingsProgress summary={withGoal} onGoalSaved={onGoalSaved} onTransferred={vi.fn()} />
    );

    await userEvent.click(screen.getByRole("button", { name: /edit goal/i }));
    const input = screen.getByLabelText(/savings goal in dollars/i);
    expect(input).toHaveValue(10000);
    await userEvent.clear(input);
    await userEvent.type(input, "5000");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(onGoalSaved).toHaveBeenCalledWith(refreshed));
    expect(updateSavingsGoal).toHaveBeenCalledWith(5000);
    expect(screen.queryByLabelText(/savings goal in dollars/i)).not.toBeInTheDocument();
  });

  it("rejects an invalid amount without calling the API", async () => {
    render(<SavingsProgress summary={noGoal} onGoalSaved={vi.fn()} onTransferred={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /set goal/i }));
    await userEvent.type(screen.getByLabelText(/savings goal in dollars/i), "0");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/enter an amount above \$0/i)).toBeInTheDocument();
    expect(updateSavingsGoal).not.toHaveBeenCalled();
  });

  it("shows an error and stays in edit mode when saving fails", async () => {
    vi.mocked(updateSavingsGoal).mockRejectedValue(new Error("server error"));
    const onGoalSaved = vi.fn();
    render(<SavingsProgress summary={noGoal} onGoalSaved={onGoalSaved} onTransferred={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /set goal/i }));
    await userEvent.type(screen.getByLabelText(/savings goal in dollars/i), "1500");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/couldn't save your goal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/savings goal in dollars/i)).toBeInTheDocument();
    expect(onGoalSaved).not.toHaveBeenCalled();
  });

  it("cancel leaves the goal unchanged", async () => {
    render(<SavingsProgress summary={withGoal} onGoalSaved={vi.fn()} onTransferred={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /edit goal/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByLabelText(/savings goal in dollars/i)).not.toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(updateSavingsGoal).not.toHaveBeenCalled();
  });

  describe("moving money", () => {
    function openTransferForm(summary = withGoal) {
      const onTransferred = vi.fn();
      render(
        <SavingsProgress summary={summary} onGoalSaved={vi.fn()} onTransferred={onTransferred} />
      );
      return { onTransferred };
    }

    it("shows the account balance as available when moving to savings", async () => {
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      expect(screen.getByRole("button", { name: /to savings/i })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByText("Available: $5,000.00")).toBeInTheDocument();
    });

    it("shows the amount saved as available when moving from savings", async () => {
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.click(screen.getByRole("button", { name: /from savings/i }));
      expect(screen.getByText("Available: $2,500.00")).toBeInTheDocument();
    });

    it("moves money and passes the refreshed summary up", async () => {
      const refreshed = { ...withGoal, balance: 4000, savings_saved: 3500 };
      vi.mocked(transferSavings).mockResolvedValue(refreshed);
      const { onTransferred } = openTransferForm();

      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.type(screen.getByLabelText(/amount to move/i), "1000");
      await userEvent.click(screen.getByRole("button", { name: /^move$/i }));

      await waitFor(() => expect(onTransferred).toHaveBeenCalledWith(refreshed));
      expect(transferSavings).toHaveBeenCalledWith("to_savings", 1000);
      expect(screen.queryByLabelText(/amount to move/i)).not.toBeInTheDocument();
    });

    it("sends the chosen direction", async () => {
      vi.mocked(transferSavings).mockResolvedValue(withGoal);
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.click(screen.getByRole("button", { name: /from savings/i }));
      await userEvent.type(screen.getByLabelText(/amount to move/i), "250.50");
      await userEvent.click(screen.getByRole("button", { name: /^move$/i }));
      await waitFor(() => expect(transferSavings).toHaveBeenCalledWith("from_savings", 250.5));
    });

    it("allows moving exactly the amount available", async () => {
      vi.mocked(transferSavings).mockResolvedValue(withGoal);
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.type(screen.getByLabelText(/amount to move/i), "5000");
      await userEvent.click(screen.getByRole("button", { name: /^move$/i }));
      await waitFor(() => expect(transferSavings).toHaveBeenCalledWith("to_savings", 5000));
    });

    it.each([
      ["0", /enter an amount above \$0/i],
      ["1.234", /enter an amount above \$0/i],
      ["5000.01", /you can move up to \$5,000\.00/i],
    ])("rejects %s without calling the API", async (amount, message) => {
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.type(screen.getByLabelText(/amount to move/i), amount);
      await userEvent.click(screen.getByRole("button", { name: /^move$/i }));
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(transferSavings).not.toHaveBeenCalled();
    });

    it("disables Move when nothing is available", async () => {
      openTransferForm({ ...withGoal, savings_saved: 0 });
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.click(screen.getByRole("button", { name: /from savings/i }));
      expect(screen.getByText(/nothing in savings yet/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^move$/i })).toBeDisabled();
    });

    it("shows a specific message when the server reports insufficient funds", async () => {
      vi.mocked(transferSavings).mockRejectedValue(new Error("insufficient_funds"));
      const { onTransferred } = openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.type(screen.getByLabelText(/amount to move/i), "100");
      await userEvent.click(screen.getByRole("button", { name: /^move$/i }));
      expect(await screen.findByText(/not enough funds/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount to move/i)).toBeInTheDocument();
      expect(onTransferred).not.toHaveBeenCalled();
    });

    it("shows a generic message when the transfer fails", async () => {
      vi.mocked(transferSavings).mockRejectedValue(new Error("Failed to transfer funds"));
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.type(screen.getByLabelText(/amount to move/i), "100");
      await userEvent.click(screen.getByRole("button", { name: /^move$/i }));
      expect(await screen.findByText(/couldn't move funds/i)).toBeInTheDocument();
    });

    it("cancel closes the form without moving anything", async () => {
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByLabelText(/amount to move/i)).not.toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
      expect(transferSavings).not.toHaveBeenCalled();
    });

    it("hides both actions while a form is open", async () => {
      openTransferForm();
      await userEvent.click(screen.getByRole("button", { name: /move money/i }));
      expect(screen.queryByRole("button", { name: /move money/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /edit goal/i })).not.toBeInTheDocument();
    });
  });
});
