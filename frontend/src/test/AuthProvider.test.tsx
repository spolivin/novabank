import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/context/AuthProvider";
import { useAuth } from "@/context/useAuth";

type AuthStateCallback = (event: string, session: { user: { id: string } } | null) => void;

let capturedAuthStateCallback: AuthStateCallback | null = null;

const { mockUnsubscribe, mockGetSession, mockSignOut, mockOnAuthStateChange } = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn();
  const mockGetSession = vi.fn();
  const mockSignOut = vi.fn();
  const mockOnAuthStateChange = vi.fn((cb: AuthStateCallback) => {
    capturedAuthStateCallback = cb;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  });
  return { mockUnsubscribe, mockGetSession, mockSignOut, mockOnAuthStateChange };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  },
}));

function Consumer() {
  const { user, isAuthenticated, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user?.id ?? "null"}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  capturedAuthStateCallback = null;
  mockUnsubscribe.mockClear();
  mockSignOut.mockResolvedValue({});
});

describe("AuthProvider", () => {
  it("starts in loading state before session resolves", () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));
    renderProvider();
    expect(screen.getByTestId("loading").textContent).toBe("true");
  });

  it("sets loading to false after session resolves", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
  });

  it("isAuthenticated is false when there is no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("authenticated").textContent).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("isAuthenticated is true and user is set when a session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("authenticated").textContent).toBe("true"));
    expect(screen.getByTestId("user").textContent).toBe("user-123");
  });

  it("updates user when onAuthStateChange fires with a session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    act(() => capturedAuthStateCallback!("SIGNED_IN", { user: { id: "user-456" } }));

    await waitFor(() => expect(screen.getByTestId("authenticated").textContent).toBe("true"));
    expect(screen.getByTestId("user").textContent).toBe("user-456");
  });

  it("clears user when onAuthStateChange fires with null session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("authenticated").textContent).toBe("true"));

    act(() => capturedAuthStateCallback!("SIGNED_OUT", null));

    await waitFor(() => expect(screen.getByTestId("authenticated").textContent).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("calls supabase signOut when signOut is invoked", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    function SignOutButton() {
      const { signOut } = useAuth();
      return <button onClick={signOut}>Sign out</button>;
    }

    render(
      <AuthProvider>
        <SignOutButton />
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("unsubscribes from auth state changes on unmount", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { unmount } = renderProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
