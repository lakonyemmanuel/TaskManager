# TaskManager

TaskManager is a full-stack task management web application with a React frontend and Express + Prisma backend.

## Production scope and acceptance checklist

A release is considered production-ready when all of the following are true:

- [ ] Backend and frontend pass CI (lint/build/test).
- [ ] Required environment variables are configured from `backend/.env.example`.
- [ ] Prisma migrations are applied and seed data is available for smoke testing.
- [ ] CORS, JWT expiry, and rate limits are configured for the target environment.
- [ ] Containers build successfully (`backend/Dockerfile`, `frontend/Dockerfile`).
- [ ] Deployment + rollback runbook steps are documented and validated.

## Architecture

- `frontend/`: React + TypeScript + Vite application.
- `backend/`: Express + TypeScript API server with Prisma/PostgreSQL.
- `docs/`: Operational and deployment documentation.
- `.github/workflows/ci.yml`: CI quality gates.

## Local development

### Backend

```bash
cd /home/runner/work/TaskManager/TaskManager/backend
cp .env.example .env
npm ci
npm run prisma:generate
npm run build
npm run test
npm run dev
```

### Frontend

```bash
cd /home/runner/work/TaskManager/TaskManager/frontend
npm ci
npm run lint
npm run build
npm run dev
```

## API overview

Base URL: `http://localhost:5000/api`

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET/POST /workspaces`
- `GET/POST/PATCH/DELETE /tasks`
- `GET/POST /comments`
- `GET /activity`
- `GET /notifications`
- `GET /reports`

Most API routes require an `Authorization` header carrying a valid access token.

## Deployment

See `docs/production-checklist.md` for environment setup, deployment, and rollback steps.
