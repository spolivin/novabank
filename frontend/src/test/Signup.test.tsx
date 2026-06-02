import { MemoryRouter, Route, Routes } from "react-router-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/useAuth";
import { supabase } from "@/lib/supabase";
import Signup from "@/pages/Signup";

vi.mock("@/context/useAuth");

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

function renderSignup(isAuthenticated = false) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated,
    loading: false,
    user: null,
    signOut: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function fillForm({
  fullName = "Jane Doe",
  email = "jane@example.com",
  password = "password123",
  confirmPassword = "password123",
}: {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
} = {}) {
  await userEvent.type(screen.getByPlaceholderText(/jane doe/i), fullName);
  await userEvent.type(screen.getByPlaceholderText(/jane@example.com/i), email);
  const [passwordInput, confirmInput] =
    screen.getAllByPlaceholderText(/min\. 8 characters|repeat/i);
  await userEvent.type(passwordInput, password);
  await userEvent.type(confirmInput, confirmPassword);
}

describe("Signup", () => {
  it("renders the form fields and submit button", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/jane@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("redirects to dashboard if already authenticated", () => {
    renderSignup(true);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows validation error when full name is too short", async () => {
    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/jane doe/i), "J");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/jane doe/i), "Jane Doe");
    await userEvent.type(screen.getByPlaceholderText(/jane@example.com/i), "notanemail");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("shows validation error when password is too short", async () => {
    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/jane doe/i), "Jane Doe");
    await userEvent.type(screen.getByPlaceholderText(/jane@example.com/i), "jane@example.com");
    const [passwordInput] = screen.getAllByPlaceholderText(/min\. 8 characters|repeat/i);
    await userEvent.type(passwordInput, "short");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    renderSignup();
    await fillForm({ password: "password123", confirmPassword: "different!" });
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows confirm email message when signup succeeds without session", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: "u1" } as never, session: null },
      error: null,
    });
    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });

  it("navigates to dashboard when signup returns a session", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: "u1" } as never,
        session: { access_token: "tok" } as never,
      },
      error: null,
    });
    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());
  });

  it("shows error message when signup API call fails", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Server error" } as never,
    });
    renderSignup();
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/unable to create account/i)).toBeInTheDocument();
  });
});
