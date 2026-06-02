import React from "react";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/useAuth";
import { deleteAccount } from "@/lib/api";
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

vi.mock("@/context/useAuth");
vi.mock("@/lib/api");
vi.mock("@/components/ui/AIAssistant", () => ({ default: () => null }));

const mockUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "user@test.com",
  user_metadata: { full_name: "Jane Doe" },
};

function renderDashboard(user: typeof mockUser | null = mockUser) {
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
  return { signOut };
}

describe("Dashboard", () => {
  it("redirects to login when user is null", () => {
    renderDashboard(null);
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders the user display name", () => {
    renderDashboard();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders summary card labels", () => {
    renderDashboard();
    expect(screen.getByText(/account balance/i)).toBeInTheDocument();
    expect(screen.getByText(/monthly spending/i)).toBeInTheDocument();
    expect(screen.getByText(/savings goal/i)).toBeInTheDocument();
  });

  it("renders the recent transactions section", () => {
    renderDashboard();
    expect(screen.getByText(/recent transactions/i)).toBeInTheDocument();
  });

  it("shows the initial delete button, not the confirm dialog", () => {
    renderDashboard();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /yes, delete permanently/i })
    ).not.toBeInTheDocument();
  });

  it("shows confirm and cancel buttons after clicking delete account", async () => {
    renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(screen.getByRole("button", { name: /yes, delete permanently/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("hides the confirm dialog when cancel is clicked", async () => {
    renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("button", { name: /yes, delete permanently/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("calls deleteAccount and navigates home on confirmed delete", async () => {
    vi.mocked(deleteAccount).mockResolvedValue(undefined);
    const { signOut } = renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await userEvent.click(screen.getByRole("button", { name: /yes, delete permanently/i }));
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledOnce());
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText("Home page")).toBeInTheDocument());
  });

  it("shows error message and restores delete button when deleteAccount fails", async () => {
    vi.mocked(deleteAccount).mockRejectedValue(new Error("server error"));
    renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await userEvent.click(screen.getByRole("button", { name: /yes, delete permanently/i }));
    expect(await screen.findByText(/failed to delete account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("signs out and navigates to login on log out click", async () => {
    const { signOut } = renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
  });
});
