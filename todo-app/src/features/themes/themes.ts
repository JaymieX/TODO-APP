export const THEME_STORAGE_KEY = "todo-thingy-theme";

export const themes = [
  { id: "midnight-blue", label: "Midnight Blue" },
  { id: "jirai-kei", label: "Jirai Kei" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export const defaultTheme: ThemeId = "midnight-blue";

export function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
