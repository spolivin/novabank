import { Suspense, lazy } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "@/components/ui/ErrorBoundary";

// Suppress React's error boundary noise in test output
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

function Bomb(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("shows fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/A page failed to load/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });

  it("calls window.location.reload when Reload is clicked", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload },
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    await userEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("catches errors from failed lazy imports", async () => {
    const FailingPage = lazy(() => Promise.reject(new Error("chunk load failed")) as never);

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <FailingPage />
        </Suspense>
      </ErrorBoundary>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await screen.findByText("Something went wrong");
  });
});
