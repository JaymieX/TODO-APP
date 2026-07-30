import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsDialog } from "./SettingsDialog";

const clerkMocks = vi.hoisted(() => ({
  openUserProfile: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ openUserProfile: clerkMocks.openUserProfile }),
  useUser: () => ({
    user: {
      fullName: "User Test",
      primaryEmailAddress: { emailAddress: "user@example.com" },
    },
  }),
}));

vi.mock("./GeneralSettings", () => ({
  GeneralSettings: () => <p>General preferences</p>,
}));

describe("SettingsDialog", () => {
  it("opens Clerk account management from the account tab", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SettingsDialog isOpen onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("General preferences")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Account & security" }));
    await user.click(screen.getByRole("button", { name: "Open account manager" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(clerkMocks.openUserProfile).toHaveBeenCalledOnce();
  });
});
