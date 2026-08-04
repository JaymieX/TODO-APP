import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsageSettings } from "./UsageSettings";

const usageMocks = vi.hoisted(() => ({ getUsage: vi.fn() }));

vi.mock("@/features/rate-limit/usage-repository", () => ({
  usageRepository: usageMocks,
}));

describe("UsageSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usageMocks.getUsage.mockResolvedValue({
      used: 12,
      limit: 30,
      remaining: 18,
      resetAt: "2026-08-05T10:00:00.000Z",
      lastRequestAt: "2026-08-04T13:00:00.000Z",
    });
  });

  it("shows the current assistant allowance", async () => {
    render(<UsageSettings />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading usage");
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("of 30 used")).toBeInTheDocument();
    expect(screen.getByText("18 remaining")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "AI assistant request usage" })).toHaveValue(12);
    expect(screen.getByText(/^Resets /)).toBeInTheDocument();
  });

  it("allows a failed request to be retried", async () => {
    const user = userEvent.setup();
    usageMocks.getUsage
      .mockRejectedValueOnce(new Error("Unable to load assistant usage."))
      .mockResolvedValueOnce({
        used: 0,
        limit: 30,
        remaining: 30,
        resetAt: null,
        lastRequestAt: null,
      });
    render(<UsageSettings />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load assistant usage.");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByText("30 remaining")).toBeInTheDocument());
    expect(usageMocks.getUsage).toHaveBeenCalledTimes(2);
  });
});
