# Todo App Agent Guide

This is a learning project, but changes should be production-quality when practical. Prefer short, clear code over long abstractions. Keep concepts approachable for newcomers.

## Stack and commands

- Next.js 16 with React 19, TypeScript, and the **Pages Router**.
- Tailwind CSS 4 using CSS-first `@theme` configuration.
- pnpm is the package manager; do not use npm or yarn.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` before finishing meaningful changes.

Next.js 16 may differ from older conventions. Check the relevant installed or official Next.js documentation before changing framework APIs, and do not migrate to the App Router unless explicitly requested.

## Project structure

- `src/pages/` — route-level page composition. `index.tsx` is `/`; `calendar.tsx` is `/calendar`.
- `src/components/` — rendered UI grouped into `layout`, `todos`, and `calendar`.
- `src/features/` — state, storage, types, and pure business/date helpers.
- `src/styles/theme.css` — semantic Tailwind design tokens.
- `src/styles/globals.css` — Tailwind import and global base styles.
- `src/test/setup.ts` — shared Vitest and Testing Library setup.

Keep pages focused on composing components. Put visual building blocks in `components` and non-visual feature logic in `features`.

## Code and tests

- Add simple one-line comments where behavior is not obvious, especially around React state, browser storage, or date handling. Avoid comments that merely repeat the code.
- Keep tests beside the code they cover as `*.test.ts` or `*.test.tsx`.
- Use pure helper functions for calculations so they are easy to test.
- Preserve the existing local-storage key and stored todo shape unless a migration is included.
- Reuse semantic theme classes such as `bg-app` and `text-muted` instead of scattering app-specific color values through components.
