import { MemoryRouter } from "react-router-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/useAuth";

vi.mock("@/context/useAuth");

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: false,
    loading: false,
    user: null,
    signOut: vi.fn(),
  });
});

describe("Navbar", () => {
  it("renders a trigger per nav group", () => {
    renderNavbar();
    expect(screen.getByRole("button", { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /company/i })).toBeInTheDocument();
  });

  it("exposes both log in and sign up when signed out", () => {
    renderNavbar();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("lists a group's routes once its menu is open", async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole("button", { name: /company/i }));

    expect(await screen.findByRole("menu", { name: "Company" })).toBeInTheDocument();
    for (const label of ["About", "Security", "Careers", "Contact"]) {
      expect(screen.getByRole("menuitem", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  // Hovering opens the menu, so a mouse click arriving right after must not
  // toggle it straight back shut.
  it("keeps the menu open when a hover is followed by a click", async () => {
    renderNavbar();
    const trigger = screen.getByRole("button", { name: /products/i });

    await userEvent.hover(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles on keyboard activation", async () => {
    renderNavbar();
    const trigger = screen.getByRole("button", { name: /products/i });

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("menu", { name: "Products" })).toBeInTheDocument();
  });

  it("toggles on touch tap, which never hovers", async () => {
    renderNavbar();
    const trigger = screen.getByRole("button", { name: /products/i });

    await userEvent.pointer([{ keys: "[TouchA]", target: trigger }]);
    expect(await screen.findByRole("menu", { name: "Products" })).toBeInTheDocument();

    // AnimatePresence keeps the panel mounted until its exit animation ends.
    await userEvent.pointer([{ keys: "[TouchA]", target: trigger }]);
    await waitFor(() =>
      expect(screen.queryByRole("menu", { name: "Products" })).not.toBeInTheDocument()
    );
  });

  it("closes an open menu on Escape", async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole("button", { name: /company/i }));
    expect(await screen.findByRole("menu", { name: "Company" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu", { name: "Company" })).not.toBeInTheDocument()
    );
  });

  it("shows the user menu with a sign out action when authenticated", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { user_metadata: { full_name: "Ada Lovelace" } } as never,
      signOut: vi.fn(),
    });
    renderNavbar();

    const trigger = screen.getByRole("button", { name: /ada lovelace/i });
    expect(trigger).toBeInTheDocument();

    await userEvent.click(trigger);
    expect(await screen.findByRole("menuitem", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /log out/i })).toBeInTheDocument();
  });

  it("reserves the actions slot while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      signOut: vi.fn(),
    });
    renderNavbar();

    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
  });
});
