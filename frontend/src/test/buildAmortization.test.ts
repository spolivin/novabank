import { describe, expect, it } from "vitest";

import { buildAmortization } from "@/pages/Loans/buildAmortization";
import { APR } from "@/pages/Loans/loans.data";

describe("buildAmortization", () => {
  it("returns data array with termMonths + 1 entries (month 0 through term)", () => {
    const { data } = buildAmortization(10_000, 12);
    expect(data).toHaveLength(13);
  });

  it("data[0].balance equals the principal", () => {
    const principal = 25_000;
    const { data } = buildAmortization(principal, 36);
    expect(data[0]).toEqual({ month: 0, balance: principal });
  });

  it("data entries are indexed by month", () => {
    const { data } = buildAmortization(10_000, 12);
    data.forEach((entry, i) => expect(entry.month).toBe(i));
  });

  it("final balance rounds to zero", () => {
    const { data } = buildAmortization(10_000, 12);
    expect(data[data.length - 1].balance).toBe(0);
  });

  it("balance decreases monotonically", () => {
    const { data } = buildAmortization(10_000, 24);
    for (let i = 1; i < data.length; i++) {
      expect(data[i].balance).toBeLessThanOrEqual(data[i - 1].balance);
    }
  });

  it("payment * termMonths equals principal + totalInterest", () => {
    const principal = 20_000;
    const termMonths = 60;
    const { payment, totalInterest } = buildAmortization(principal, termMonths);
    expect(payment * termMonths).toBeCloseTo(principal + totalInterest, 0);
  });

  it("totalInterest is greater than zero", () => {
    const { totalInterest } = buildAmortization(10_000, 12);
    expect(totalInterest).toBeGreaterThan(0);
  });

  it("monthly payment increases as term decreases (same principal)", () => {
    const { payment: p60 } = buildAmortization(10_000, 60);
    const { payment: p12 } = buildAmortization(10_000, 12);
    expect(p12).toBeGreaterThan(p60);
  });

  it("total interest increases as term increases (same principal)", () => {
    const { totalInterest: i12 } = buildAmortization(10_000, 12);
    const { totalInterest: i60 } = buildAmortization(10_000, 60);
    expect(i60).toBeGreaterThan(i12);
  });

  it("uses the APR constant (5.99%) for a known payment", () => {
    // Independently computed: P=12000, n=12, r=APR/100/12
    const r = APR / 100 / 12;
    const n = 12;
    const P = 12_000;
    const expected = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const { payment } = buildAmortization(P, n);
    expect(payment).toBeCloseTo(expected, 6);
  });
});
