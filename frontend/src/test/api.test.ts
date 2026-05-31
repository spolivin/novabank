import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteAccount, fetchChatHistory, sendChatMessage } from "@/lib/api";

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
