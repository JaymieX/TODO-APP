import { ThemeSelector } from "./ThemeSelector";

export function GeneralSettings() {
  return (
    <div className="w-full max-w-2xl text-ink">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary">
          App preferences
        </p>
        <h2 className="mt-2 font-title text-2xl font-semibold text-ink">
          General
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Personalize how Todo Thingy looks and feels. These settings follow your account.
        </p>
      </div>

      <section
        aria-labelledby="appearance-settings-title"
        className="mt-6 rounded-xl border border-line bg-panel p-5"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 id="appearance-settings-title" className="font-semibold text-ink">
              Appearance
            </h3>
            <p className="mt-1 text-sm text-muted">
              Choose the color theme used throughout your workspace.
            </p>
          </div>
          <ThemeSelector />
        </div>
      </section>
    </div>
  );
}
