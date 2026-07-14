# BWAT.md

This file provides guidance to Bwat when working with code in this repository.

## Tech Stack

- **Backend**: Express.js + TypeScript (NodeNext modules), Prisma ORM + PostgreSQL, JWT auth (bcryptjs + jsonwebtoken)
- **Frontend**: React 19 + TypeScript, Vite 8, React Router v7, Redux Toolkit
- **Validation**: Zod (backend)
- **No Tailwind CSS** — frontend uses plain CSS (no design system framework installed)

## Brand Identity

**Colors** (taken from frontend/src/index.css CSS custom properties):
- Primary / accent: `#aa3bff` (light mode), `#c084fc` (dark mode)
- Text: `#6b6375` light / `#9ca3af` dark
- Text (headings): `#08060d` light / `#f3f4f6` dark
- Background: `#fff` light / `#16171d` dark
- Border: `#e5e4e7` light / `#2e303a` dark
- Code bg: `#f4f3ec` light / `#1f2028` dark
- Shadow: `rgba(0,0,0,0.1) 0 10px 15px -3px, rgba(0,0,0,0.05) 0 4px 6px -2px` light / `rgba(0,0,0,0.4)` dark

**Secondary slate palette** (from App.css):
- Button/accent: `#38bdf8` (sky blue)
- Card/panel bg: `rgba(15, 23, 42, 0.92)` / `#1e293b` / `#020617` (dark slate tones)
- Dashboard bg gradient: `linear-gradient(135deg, #020617, #111827)`
- Auth bg gradient: `linear-gradient(135deg, #0f172a, #1e293b)`

**Typography**:
- Body/UI: `system-ui, 'Segoe UI', Roboto, sans-serif` (`--sans`)
- Headings: same as body (`--heading`)
- Monospace: `ui-monospace, Consolas, monospace` (`--mono`)
- Base font: 18px/145% (16px on screens <1024px)
- Heading font-weight: 500

**Geometry**:
- Border radius (cards): 20px (auth-card, panel, kanban-column)
- Border radius (inputs/buttons): 10px
- Border radius (task cards): 12px
- Border radius (code): 4px
- Spacing scale: default CSS spacing (no custom scale)
- Box shadow: `0 20px 45px rgba(2, 6, 23, 0.35)` on cards

**Visual language**: Dark-themed, high-contrast UI with subtle gradients, generous border radius, purple accent, and transparent/semi-transparent surface overlays. Auth and dashboard use distinct gradient backgrounds. Border treatment uses thin semi-transparent borders on dark surfaces.

## Architecture Notes

**Backend has TWO parallel server entrypoints and TWO parallel route structures** — this is the most important architectural fact to understand before editing:

1. **Active/feature-based** (`src/server.ts` and `src/features/*/`): The running server. Uses Express 5 with feature-scoped route files (`features/tasks/taskRoutes.ts`, `features/auth/authRoutes.ts`, etc.) and matching feature-scoped controllers. All routes are behind `authenticate` middleware. The `src/utils/auth.ts` utility is used for JWT operations.

2. **Legacy/app-based** (`src/app.ts` and `src/controllers/`, `src/routes/`): An older Express app setup (`app.ts`) with `helmet`, `morgan`, and separate route/controller files under `controllers/` and `routes/`. The `src/config/prisma.ts` config and `routes/health.routes.ts` serve the legacy setup. This file (`app.ts`) is NOT imported by `server.ts`.

When making backend changes, modify the `src/features/*/` files unless you explicitly know the legacy path is what's in use. The `server.ts` imports:
- `features/auth/authRoutes` → `/api/auth`
- `features/workspaces/workspaceRoutes` → `/api/workspaces`
- `features/tasks/taskRoutes` → `/api/tasks`
- `features/comments/commentRoutes` → `/api/comments`
- `features/notifications/notificationRoutes` → `/api/notifications`
- `features/reports/reportRoutes` → `/api/reports`
- `routes/activityRoutes` (legacy) → `/api/activity` (note: this is the only legacy route the active server still uses)

**Prisma**: Client is generated to `generated/prisma/` (custom output path), not the default `node_modules/.prisma/client`. Import from `../../generated/prisma/client.js`. The Prisma adapter `@prisma/adapter-pg` wraps the connection. Schema uses PostgreSQL.

**JWT Auth**: `src/utils/auth.ts` — access tokens expire in 15min, refresh tokens in 7d. Tokens use a shared `JWT_SECRET` env var (falls back to `"development-secret"`). The `authenticate` middleware in `src/middleware/authMiddleware.ts` expects `Bearer <token>` in the `Authorization` header and attaches `req.user` with `{ id, email }`.

**Activity logging**: Most mutating endpoints call `createActivityLog()` from `src/utils/activity.ts`, which inserts into the `ActivityLog` table. Always call this when adding new mutation endpoints.

**Frontend router**: React Router v7 with `<BrowserRouter>`. `AppLayout` wraps authenticated routes (`/dashboard`, `/kanban`, `/reports`) with a nav bar. The root `/` route renders the monolithic `App.tsx` (which has its own auth, task management, kanban UI as a SPA-in-page — this is the primary UI). The separate feature pages under `features/` are stub pages for the layout-based routes.

**Frontend Vite proxy**: `vite.config.ts` proxies `/api` requests to `http://localhost:5000` (the backend).

## Coding Conventions

- **Backend TS import extensions**: All relative imports in backend `.ts` files use `.js` extension (e.g. `import prisma from "../../lib/prisma.js"`). This is required by NodeNext module resolution with `"type": "module"` in package.json. Do NOT use `.ts` extensions in imports.
- **Auth pattern**: Controllers cast `req` as `Request & { user?: { id: string; email: string } }` to access the authenticated user. Always check `authUser` exists and return 401 if missing.
- **Error handling**: Controllers use try/catch with `console.error(error)` and return `{ message: "Server error" }` with status 500. The `errorHandler` middleware in `shared/errorHandler.ts` is a catch-all fallback.
- **Response shape**: Always return JSON objects (`{ message, ... }`) — never plain strings or arrays at the top level.
- **Frontend**: Prefer plain CSS (no Tailwind or CSS-in-JS). Uses `App.css` for component styles and `index.css` for global/reset styles.
- **Frontend TypeScript**: `verbatimModuleSyntax` is enabled — use `import type { ... }` for type-only imports. `noUnusedLocals` and `noUnusedParameters` are strict.
- **Frontend state**: Redux Toolkit is installed but the main `App.tsx` uses local `useState` — decide per-feature whether to use Redux or local state.

## Commands

```bash
# Backend (cd backend)
npm run dev          # tsx watch src/server.ts
npm run build        # tsc
npm run start        # node dist/server.js
npm run prisma:generate    # prisma generate
npm run prisma:migrate     # prisma migrate dev

# Frontend (cd frontend)
npm run dev          # vite dev server (port 5173)
npm run build        # tsc -b && vite build
npm run lint         # eslint
npm run preview      # vite preview
```

## Gotchas

- **Two server files exist side-by-side**: `src/server.ts` (active, feature-based) and `src/app.ts` (legacy, unused by the running server). Do not edit `app.ts` unless specifically asked — it is not wired into the running application.
- **Two route structures**: `src/features/*/` (active) and `src/controllers/` + `src/routes/` (legacy). The active server imports `routes/activityRoutes.ts` from the legacy set for the `/api/activity` endpoint — this is the only crossover.
- **Prisma output path is non-standard**: `generated/prisma/` instead of the default. Import from `../../generated/prisma/client.js`. The `prisma.config.ts` at the backend root defines the custom path.
- **Prisma adapter**: Uses `@prisma/adapter-pg` with `PrismaPg` to wrap the connection string. The `PrismaClient` is initialized with `{ adapter }` in `src/lib/prisma.ts`.
- **`install.cmd`** at the project root is an unrelated "Antigravity CLI" (agy) installer — it is NOT part of the TaskManager project and should not be modified or recommended unless the user explicitly asks about it.
- **`test.js`** at the project root is an empty stub (`function fibonacci(n) {}`) — no tests are currently written.
- **Frontend routes**: The monolithic `App.tsx` handles ALL task management UI at `/` with inline auth forms, workspace CRUD, kanban board, comments, and activity feed. The separate `features/` pages (DashboardPage, KanbanPage, ReportsPage) are stub screens rendered by the layout router — they are NOT the primary UI and have minimal content.
- **Token refresh**: The `App.tsx` frontend has a `fetchJson` wrapper that attempts automatic token refresh on 401 responses using a refresh token. The backend does NOT have a `/api/auth/refresh` endpoint yet — refresh logic in the frontend calls it but it will 404.
- **Backend `package.json`` uses Express 5** (`express: ^5.2.1`) — be aware of Express 5 API differences (e.g., async error handling, `req.params` may be an array).
