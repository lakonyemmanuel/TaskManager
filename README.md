# TaskManager

TaskManager is a full-stack task management app with React + TypeScript frontend and Express + Prisma backend.

## Current MVP coverage

- Authentication (register/login/me)
- Workspaces and workspace members
- Task CRUD + comments + activity feed
- **Workspace owner email invitation flow**
  - Owner-only invite creation by email
  - Secure random invitation token + hashed storage
  - Invitation expiry and status lifecycle (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`)
  - Duplicate active invite and duplicate membership prevention
  - Resend + revoke invite actions
  - Authenticated invite acceptance for matching user email
  - Dev email delivery integration point (`EMAIL_PROVIDER=log`)

## Repository structure

- `backend/` – Express API + Prisma
- `frontend/` – Vite + React app

## Environment setup

Copy examples:

- `backend/.env.example` → `backend/.env`
- `frontend/.env.example` → `frontend/.env`

Key backend invite/email variables:

- `WORKSPACE_INVITE_EXPIRY_HOURS` (default `72`)
- `WORKSPACE_INVITE_PATH` (default `/invite`)
- `EMAIL_PROVIDER` (`log` in development)
- `FRONTEND_URL` (used in invitation links)

## Local development

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to backend (`http://localhost:5000`).

## Build and test

### Backend

```bash
cd backend
npm run build
npm run test
```

### Frontend

```bash
cd frontend
npm run build
npm run lint
```

## Invitation API endpoints

- `GET /api/workspaces/:workspaceId/invitations` (owner only)
- `POST /api/workspaces/:workspaceId/invitations` (owner only)
- `POST /api/workspaces/:workspaceId/invitations/:invitationId/resend` (owner only)
- `POST /api/workspaces/:workspaceId/invitations/:invitationId/revoke` (owner only)
- `POST /api/workspaces/invitations/accept` (authenticated invitee)

## Roadmap / Remaining Enhancements

- Password reset and email verification
- Rich dashboard analytics widgets and reporting exports
- Realtime collaboration/presence/chat with Socket.io
- Attachments upload provider integration (Cloudinary)
- Stronger automated integration/e2e coverage and CI hardening
