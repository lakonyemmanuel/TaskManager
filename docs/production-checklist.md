# Production checklist and runbook

## Environment setup

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Configure backend environment variables using `backend/.env.example`.
3. Set a strong `JWT_SECRET` (minimum 32 characters).
4. Set `CORS_ORIGIN` to your frontend domain.

## Build and validation gates

Run before every release:

```bash
cd /home/runner/work/TaskManager/TaskManager/backend
npm ci
npm run build
npm run test

cd /home/runner/work/TaskManager/TaskManager/frontend
npm ci
npm run lint
npm run build
```

## Database migration and seed

```bash
cd /home/runner/work/TaskManager/TaskManager/backend
npm run prisma:migrate
npm run prisma:seed
```

## Container deployment

```bash
cd /home/runner/work/TaskManager/TaskManager
docker compose build
docker compose up -d
```

## Rollback procedure

1. Keep previous image tags available.
2. Redeploy previous backend and frontend image versions.
3. If migration introduced breaking schema changes, restore DB from latest backup snapshot.
4. Verify `/api/health` and a login smoke test before reopening traffic.
