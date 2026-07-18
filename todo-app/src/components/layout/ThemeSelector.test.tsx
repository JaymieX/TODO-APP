import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "@/features/themes/theme-context";
import { THEME_STORAGE_KEY } from "@/features/themes/themes";
import { ThemeSelector } from "./ThemeSelector";

describe("ThemeSelector", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("applies and persists the selected theme", async () => {
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
    });
  });
});
