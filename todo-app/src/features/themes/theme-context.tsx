import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { profileRepository } from "@/features/profiles/profile-repository";
import { defaultTheme, isThemeId, THEME_STORAGE_KEY, type ThemeId } from "./themes";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const selectedSinceLoad = useRef(false);
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return defaultTheme;

    // Use the saved browser preference when this provider is first created.
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(savedTheme) ? savedTheme : defaultTheme;
  });
  const initialTheme = useRef(theme);

  useEffect(() => {
    let isCurrent = true;

    async function loadProfileTheme() {
      try {
        const savedTheme = await profileRepository.getTheme();
        if (!isCurrent || selectedSinceLoad.current) return;

        if (savedTheme) {
          setTheme(savedTheme);
        } else {
          await profileRepository.saveTheme(initialTheme.current);
        }
      } catch {
        // Keep the local preference when profile settings are temporarily unavailable.
      }
    }

    void loadProfileTheme();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function updateTheme(nextTheme: ThemeId) {
    selectedSinceLoad.current = true;
    setTheme(nextTheme);
    void profileRepository.saveTheme(nextTheme).catch(() => {
      // The browser copy remains available if the server save fails.
    });
  }

  return <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
