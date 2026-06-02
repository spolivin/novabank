import React from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TransactionTable from "@/pages/Dashboard/components/TransactionTable";

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

vi.mock("motion/react", () => ({
  motion: new Proxy({} as Record<string, unknown>, {
    get:
      (_t, tag: string) =>
      ({ children, ...props }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => {
        const domProps = Object.fromEntries(
          Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k))
        );
        return React.createElement(tag, domProps, children);
      },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseTransaction = {
  id: "1",
  date: "2026-05-12",
  description: "Salary deposit",
  category: "Income",
  amount: 5200,
};

describe("TransactionTable", () => {
  it("renders column headers", () => {
    render(<TransactionTable transactions={[]} />);
    expect(screen.getByText(/date/i)).toBeInTheDocument();
    expect(screen.getByText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/amount/i)).toBeInTheDocument();
  });

  it("renders a row for each transaction", () => {
    const transactions = [
      { ...baseTransaction, id: "1", description: "Salary deposit" },
      { ...baseTransaction, id: "2", description: "Netflix" },
    ];
    render(<TransactionTable transactions={transactions} />);
    expect(screen.getByText("Salary deposit")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("renders category as a badge", () => {
    render(<TransactionTable transactions={[baseTransaction]} />);
    expect(screen.getByText("Income")).toBeInTheDocument();
  });

  it("formats positive amounts with a leading plus sign", () => {
    render(<TransactionTable transactions={[{ ...baseTransaction, amount: 5200 }]} />);
    expect(screen.getByText("+$5,200.00")).toBeInTheDocument();
  });

  it("formats negative amounts with a leading minus sign", () => {
    render(<TransactionTable transactions={[{ ...baseTransaction, id: "2", amount: -134.72 }]} />);
    expect(screen.getByText("-$134.72")).toBeInTheDocument();
  });

  it("formats the date as Mon DD, YYYY", () => {
    render(<TransactionTable transactions={[baseTransaction]} />);
    expect(screen.getByText("May 12, 2026")).toBeInTheDocument();
  });

  it("renders an empty table body when given no transactions", () => {
    const { container } = render(<TransactionTable transactions={[]} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
  });
});
