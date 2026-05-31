import { MemoryRouter, Route, Routes } from "react-router-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/useAuth";
import { supabase } from "@/lib/supabase";
import Login from "@/pages/Login";

vi.mock("@/context/useAuth");

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

function renderLogin() {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: false,
    loading: false,
    user: null,
    signOut: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login", () => {
  it("renders the form", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/jane@example.com/i)).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("shows error on invalid credentials", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" } as never,
    });
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/jane@example.com/i), "bad@test.com");
    await userEvent.type(screen.getByPlaceholderText(/your password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it("navigates to dashboard on success", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: "u1" } as never, session: { access_token: "tok" } as never },
      error: null,
    });
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/jane@example.com/i), "user@test.com");
    await userEvent.type(screen.getByPlaceholderText(/your password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());
  });

  it("redirects to dashboard if already authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: null,
      signOut: vi.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
