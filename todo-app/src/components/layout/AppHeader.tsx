import Link from "next/link";

type AppHeaderProps = {
  activeView: "todos" | "calendar";
  eyebrow: string;
  title: string;
  description?: string;
};

const baseLink = "rounded-full px-4 py-2 text-sm font-semibold transition";
const activeLink = "bg-primary text-app";
const inactiveLink =
  "border border-line text-muted hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function AppHeader({ activeView, eyebrow, title, description }: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-line bg-surface/90 p-5 shadow-card backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-eyebrow text-primary">{eyebrow}</p>
        <h1 className="font-title text-3xl font-semibold text-ink sm:text-display">{title}</h1>
        {description ? <p className="max-w-xl text-sm text-muted sm:text-base">{description}</p> : null}
      </div>

      <nav aria-label="Main navigation" className="flex items-center gap-2">
        <Link
          href="/"
          aria-current={activeView === "todos" ? "page" : undefined}
          className={`${baseLink} ${activeView === "todos" ? activeLink : inactiveLink}`}
        >
          Todos
        </Link>
        <Link
          href="/calendar"
          aria-current={activeView === "calendar" ? "page" : undefined}
          className={`${baseLink} ${activeView === "calendar" ? activeLink : inactiveLink}`}
        >
          Calendar
        </Link>
      </nav>
    </header>
  );
}
