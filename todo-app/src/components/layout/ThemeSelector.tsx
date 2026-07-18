import { useTheme } from "@/features/themes/theme-context";
import { isThemeId, themes } from "@/features/themes/themes";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-muted">
      <span>Theme</span>
      <select
        aria-label="Theme"
        value={theme}
        onChange={(event) => {
          if (isThemeId(event.target.value)) setTheme(event.target.value);
        }}
        className="rounded-full border border-line bg-panel px-3 py-2 text-ink outline-none transition hover:border-primary focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {themes.map((availableTheme) => (
          <option key={availableTheme.id} value={availableTheme.id}>
            {availableTheme.label}
          </option>
        ))}
      </select>
    </label>
  );
}
