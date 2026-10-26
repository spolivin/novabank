import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import DemoBanner from "@/components/layout/DemoBanner";

describe("DemoBanner", () => {
  it("shows the demo notice by default", () => {
    render(<DemoBanner />);
    expect(screen.getByText(/not a real bank/i)).toBeInTheDocument();
  });

  it("hides after dismissing and shows again on remount", async () => {
    const { unmount } = render(<DemoBanner />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss demo notice/i }));
    await waitFor(() => expect(screen.queryByText(/not a real bank/i)).not.toBeInTheDocument());

    unmount();
    render(<DemoBanner />);
    expect(screen.getByText(/not a real bank/i)).toBeInTheDocument();
  });
});
