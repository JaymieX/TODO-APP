# Todo Thingy

A small todo and calendar app for learning React, TypeScript, Next.js, and Tailwind CSS without hiding the important ideas behind a large framework.

## Run the app

This project uses pnpm:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Tasks are currently saved in your browser.

## Supabase connection

Tasks are stored in the Supabase `todo` table. `TodoProvider` loads the table when the app opens and saves each create, completion, edit, and deletion back to Supabase.

Copy `.env.example` to `.env.local`, then add the values from your Supabase project's Connect dialog:

```bash
cp .env.example .env.local
```

Use the project URL and publishable key only. The service-role key must never be exposed through a `NEXT_PUBLIC_` variable. The table needs a generated `id` primary key plus `task_name`, `task_complete`, `estimated_time`, and `due_date` columns. If Row Level Security is enabled, add policies that allow the operations this app needs.

Useful checks:

```bash
pnpm lint
pnpm test
pnpm test:watch
pnpm build
```

## Project structure

```text
src/
├── pages/                  # Next.js pages and their route-level composition
├── components/             # Layout, todo, and calendar UI components
├── features/
│   ├── todos/              # Todo state, storage, types, and pure helpers
│   └── calendar/           # Pure calendar and deadline helpers
├── styles/                 # Tailwind theme and global CSS
└── test/                   # Shared test setup
```

This project uses Next.js's Pages Router because the route files are especially clear for learners. `pages/index.tsx` creates `/`, while `pages/calendar.tsx` creates `/calendar`. The special `_app.tsx` file sets up state and global CSS for every page.

Components are grouped by what they render: shared layout, todo UI, or calendar UI. Feature folders contain the non-visual logic that those components use.

## How the data moves

`TodoProvider` is the single source of task state. Interactive components access it through `useTodos()`. The provider loads from Supabase after React hydrates, then updates its state only after the corresponding database request succeeds.

Pure calculations live outside React components. For example, filters, progress, deadline checks, and calendar dates can be tested without rendering a page.

## Styling

This app uses Tailwind CSS 4's CSS-first configuration. App-specific design tokens are defined in `src/styles/theme.css` with `@theme` and produce semantic classes such as `bg-app`, `text-muted`, and `border-danger`.

Use regular Tailwind utilities for common spacing and layout. Add a theme token when a color, font, radius, or shadow represents part of the app's reusable visual language.

## Good places to start learning

- Change a route layout in `src/pages/index.tsx` or `src/pages/calendar.tsx`.
- Follow a form submission from `TodoForm` into the provider.
- Add a new derived value to `todo-utils.ts`, test it, and display it in a component.
- Adjust a semantic design token in `src/styles/theme.css` and see every use update.

The app intentionally has no database, authentication, state library, or component framework. Those can be introduced later when the product needs them.
