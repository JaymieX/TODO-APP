import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "./AccountMenu";

const clerkMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: clerkMocks.signOut }),
  useUser: () => ({
    user: {
      fullName: "User Test",
      username: "usertest",
      imageUrl: "",
    },
  }),
}));

vi.mock("./SettingsDialog", () => ({
  SettingsDialog: ({ isOpen }: { isOpen: boolean }) => (
    isOpen ? <div role="dialog" aria-label="Settings test" /> : null
  ),
}));

describe("AccountMenu", () => {
  it("opens the app settings without Clerk's default account item", async () => {
    const user = userEvent.setup();
    render(<AccountMenu />);

    expect(screen.getByText("User Test")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));

    const menu = screen.getByRole("menu", { name: "Account menu" });
    expect(within(menu).queryByText("Manage account")).not.toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: "Settings" }));

    expect(screen.getByRole("dialog", { name: "Settings test" })).toBeInTheDocument();
  });
});
