import Link from "next/link";
import { ThemeSelector } from "./ThemeSelector";

type AppHeaderProps = {
  activeView: "todos" | "calendar";
};

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

const baseLink =
  "flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const activeLink = "bg-primary text-surface";
const inactiveLink =
  "text-muted hover:bg-panel hover:text-ink";

export function AppHeader({ activeView }: AppHeaderProps) {
  return (
    <header className="flex w-full flex-col gap-5 lg:h-full">
      <div className="flex items-center justify-between gap-4 lg:block">
        <Link href="/" className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary">Learning React</p>
          <p className="mt-1 font-title text-2xl font-semibold text-ink transition group-hover:text-primary">Todo Thingy</p>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        <p className="hidden px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-subtle lg:block">
          Workspace
        </p>
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

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 lg:block">
        <p className="hidden text-xs leading-5 text-subtle lg:block">Keep your plans and deadlines in one place.</p>
        <div className="lg:mt-4"><ThemeSelector /></div>
      </div>
    </header>
  );
}

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="border-b border-line pb-6 sm:pb-8">
      <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary">{eyebrow}</p>
      <h1 className="mt-2 font-title text-3xl font-semibold text-ink sm:text-display">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{description}</p> : null}
    </section>
  );
}
