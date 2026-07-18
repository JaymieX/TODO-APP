import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

type AppShellProps = {
  activeView: "todos" | "calendar";
  children: ReactNode;
};

export function AppShell({ activeView, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-app px-4 py-5 text-ink sm:px-6 sm:py-8 lg:pl-[20rem] lg:pr-10 lg:pt-10">
      <aside className="border-b border-line pb-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:border-line lg:bg-surface/90 lg:p-6 lg:backdrop-blur">
        <AppHeader activeView={activeView} />
      </aside>
      <div className="mx-auto min-w-0 w-full pb-4 lg:py-3 xl:w-4/5">{children}</div>
    </main>
  );
}
