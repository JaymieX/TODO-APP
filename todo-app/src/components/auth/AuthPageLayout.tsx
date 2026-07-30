import type { ReactNode } from "react";

type AuthPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const benefits = [
  "Private tasks protected by your account",
  "Your theme follows you between devices",
  "Deadlines and progress stay in sync",
];

export function AuthPageLayout({
  eyebrow,
  title,
  description,
  children,
}: AuthPageLayoutProps) {
  return (
    <div
      data-theme="midnight-blue"
      className="relative min-h-screen overflow-hidden bg-app px-4 py-8 text-ink sm:px-8 lg:px-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
      />

      <main className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <section className="max-w-xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary">
              Learning React
            </p>
            <p className="mt-2 font-title text-2xl font-semibold text-ink">
              Todo Thingy
            </p>
          </div>

          <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-title text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg">
            {description}
          </p>

          <div className="mt-9 grid gap-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 px-4 py-3 text-sm text-muted backdrop-blur"
              >
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary"
                >
                  ✓
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label="Account access"
          className="mx-auto w-full max-w-md rounded-card border border-line bg-panel/60 p-2 shadow-card backdrop-blur sm:p-4"
        >
          {children}
        </section>
      </main>
    </div>
  );
}
