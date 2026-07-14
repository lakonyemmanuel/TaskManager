# TaskManager Frontend

## Scripts

- `npm run dev` - start Vite dev server.
- `npm run lint` - run ESLint checks.
- `npm run build` - compile TypeScript and produce production assets.
- `npm run preview` - preview built assets.

## Runtime behavior

- Uses `/api` proxy in development (`vite.config.ts`) to reach backend on `http://localhost:5000`.
- Uses centralized API client at `src/shared/api/client.ts` for token attach/refresh and error handling.

## Environment notes

If deploying frontend separately, configure reverse proxy so `/api/*` forwards to the backend API service.
