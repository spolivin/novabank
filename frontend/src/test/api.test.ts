import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deleteAccount,
  fetchChatHistory,
  fetchDashboardSummary,
  fetchTransactions,
  sendChatMessage,
  transferSavings,
  updateSavingsGoal,
} from "@/lib/api";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
  },
}));

const API = import.meta.env.VITE_API_URL;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("fetchChatHistory", () => {
  it("returns parsed history on success", async () => {
    const history = [{ role: "user", content: "hi" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(history) })
    );
    const result = await fetchChatHistory();
    expect(result).toEqual(history);
    expect(fetch).toHaveBeenCalledWith(`${API}/ai/history`, {
      headers: { Authorization: "Bearer test-token" },
    });
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchChatHistory()).rejects.toThrow("Failed to fetch history");
  });
});

describe("fetchTransactions", () => {
  it("returns parsed transactions on success", async () => {
    const transactions = [
      {
        id: "tx-1",
        date: "2026-09-12",
        description: "Salary deposit",
        category: "Income",
        amount: 5200,
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(transactions) })
    );
    const result = await fetchTransactions();
    expect(result).toEqual(transactions);
    expect(fetch).toHaveBeenCalledWith(`${API}/transactions`, {
      headers: { Authorization: "Bearer test-token" },
    });
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchTransactions()).rejects.toThrow("Failed to fetch transactions");
  });
});

const summary = {
  balance: 8412.55,
  monthly_spending: 1734.2,
  savings_goal: 10000,
  savings_saved: 1200,
};

describe("fetchDashboardSummary", () => {
  it("returns the parsed summary on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(summary) })
    );
    const result = await fetchDashboardSummary();
    expect(result).toEqual(summary);
    expect(fetch).toHaveBeenCalledWith(`${API}/dashboard/summary`, {
      headers: { Authorization: "Bearer test-token" },
    });
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchDashboardSummary()).rejects.toThrow("Failed to fetch dashboard summary");
  });
});

describe("updateSavingsGoal", () => {
  it("PUTs the goal and returns the refreshed summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(summary) })
    );
    const result = await updateSavingsGoal(10000);
    expect(result).toEqual(summary);
    expect(fetch).toHaveBeenCalledWith(`${API}/dashboard/savings-goal`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ savings_goal: 10000 }),
    });
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(updateSavingsGoal(500)).rejects.toThrow("Failed to update savings goal");
  });
});

describe("transferSavings", () => {
  it("POSTs the direction and amount and returns the refreshed summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(summary) })
    );
    const result = await transferSavings("to_savings", 250.5);
    expect(result).toEqual(summary);
    expect(fetch).toHaveBeenCalledWith(`${API}/dashboard/savings-transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ direction: "to_savings", amount: 250.5 }),
    });
  });

  it("throws insufficient_funds on 409", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409 }));
    await expect(transferSavings("from_savings", 10)).rejects.toThrow("insufficient_funds");
  });

  it("throws on other non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(transferSavings("to_savings", 10)).rejects.toThrow("Failed to transfer funds");
  });
});

describe("sendChatMessage", () => {
  it("returns reply on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reply: "Hello!" }),
        status: 200,
      })
    );
    const result = await sendChatMessage("hi");
    expect(result).toBe("Hello!");
  });

  it("throws rate_limit_exceeded on 429", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(sendChatMessage("hi")).rejects.toThrow("rate_limit_exceeded");
  });

  it("throws on other non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(sendChatMessage("hi")).rejects.toThrow("Failed to get reply");
  });

  it("sends correct request body", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({ reply: "ok" }), status: 200 })
    );
    await sendChatMessage("hello");
    expect(fetch).toHaveBeenCalledWith(
      `${API}/ai/chat`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      })
    );
  });
});

describe("deleteAccount", () => {
  it("resolves on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await expect(deleteAccount()).resolves.toBeUndefined();
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(deleteAccount()).rejects.toThrow("Failed to delete account");
  });
});
