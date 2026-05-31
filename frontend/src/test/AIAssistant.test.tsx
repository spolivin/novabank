import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AIAssistant from "@/components/ui/AIAssistant";
import { fetchChatHistory, sendChatMessage } from "@/lib/api";

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

vi.mock("@/lib/api");

beforeEach(() => {
  vi.mocked(fetchChatHistory).mockResolvedValue([]);
  vi.mocked(sendChatMessage).mockResolvedValue("Nova reply");
});

async function openAssistant() {
  await userEvent.click(screen.getByRole("button", { name: /open ai assistant/i }));
}

describe("AIAssistant", () => {
  it("renders the toggle button", () => {
    render(<AIAssistant />);
    expect(screen.getByRole("button", { name: /open ai assistant/i })).toBeInTheDocument();
  });

  it("opens the chat panel on click", async () => {
    render(<AIAssistant />);
    await openAssistant();
    expect(screen.getByText(/novabank assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/hi! i'm your novabank/i)).toBeInTheDocument();
  });

  it("loads and displays history on open", async () => {
    vi.mocked(fetchChatHistory).mockResolvedValue([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi there" },
    ]);
    render(<AIAssistant />);
    await openAssistant();
    expect(await screen.findByText("hello")).toBeInTheDocument();
    expect(screen.getByText("hi there")).toBeInTheDocument();
  });

  it("sends a message and shows reply", async () => {
    render(<AIAssistant />);
    await openAssistant();
    await waitFor(() => expect(fetchChatHistory).toHaveBeenCalled());
    const input = screen.getByPlaceholderText(/ask something/i);
    await userEvent.type(input, "what is nova?");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText("Nova reply")).toBeInTheDocument();
  });

  it("shows rate limit message on 429", async () => {
    vi.mocked(sendChatMessage).mockRejectedValue(new Error("rate_limit_exceeded"));
    render(<AIAssistant />);
    await openAssistant();
    await waitFor(() => expect(fetchChatHistory).toHaveBeenCalled());
    await userEvent.type(screen.getByPlaceholderText(/ask something/i), "hi");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText(/too many messages/i)).toBeInTheDocument();
  });

  it("shows generic error on other failures", async () => {
    vi.mocked(sendChatMessage).mockRejectedValue(new Error("network error"));
    render(<AIAssistant />);
    await openAssistant();
    await waitFor(() => expect(fetchChatHistory).toHaveBeenCalled());
    await userEvent.type(screen.getByPlaceholderText(/ask something/i), "hi");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText(/couldn't reach the server/i)).toBeInTheDocument();
  });

  it("re-fetches history on re-open after close", async () => {
    render(<AIAssistant />);
    await openAssistant();
    await waitFor(() => expect(fetchChatHistory).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: /close chat/i }));
    vi.mocked(fetchChatHistory).mockClear();
    await openAssistant();
    await waitFor(() => expect(fetchChatHistory).toHaveBeenCalledOnce());
  });
});
