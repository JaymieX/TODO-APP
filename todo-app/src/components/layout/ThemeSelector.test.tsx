import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/features/themes/theme-context";
import { THEME_STORAGE_KEY } from "@/features/themes/themes";
import { ThemeSelector } from "./ThemeSelector";

const profileMocks = vi.hoisted(() => ({
  getTheme: vi.fn(),
  saveTheme: vi.fn(),
}));

vi.mock("@/features/profiles/profile-repository", () => ({
  profileRepository: profileMocks,
}));

describe("ThemeSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileMocks.getTheme.mockResolvedValue(null);
    profileMocks.saveTheme.mockResolvedValue(undefined);
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("applies and persists the selected theme locally and in the user profile", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Theme" }), "jirai-kei");

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("jirai-kei");
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("jirai-kei");
      expect(profileMocks.saveTheme).toHaveBeenCalledWith("jirai-kei");
    });
  });

  it("loads the saved profile theme", async () => {
    profileMocks.getTheme.mockResolvedValue("jirai-kei");

    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Theme" })).toHaveValue("jirai-kei");
      expect(document.documentElement.dataset.theme).toBe("jirai-kei");
    });
  });
});
