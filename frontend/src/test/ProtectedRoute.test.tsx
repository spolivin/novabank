import { MemoryRouter, Route, Routes } from "react-router-dom";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute from "@/components/ui/ProtectedRoute";
import { useAuth } from "@/context/useAuth";

vi.mock("@/context/useAuth");

function renderRoute(child = <div>Protected</div>) {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/dashboard" element={<ProtectedRoute>{child}</ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("renders children when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: null,
      signOut: vi.fn(),
    });
    renderRoute();
    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      signOut: vi.fn(),
    });
    renderRoute();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders nothing while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      signOut: vi.fn(),
    });
    const { container } = renderRoute();
    expect(container).toBeEmptyDOMElement();
  });
});
