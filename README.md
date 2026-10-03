# TeamOps

TeamOps is a lightweight operations hub for small software teams. It combines a polished dashboard UI with a small backend API, giving teams a fast, private workspace for managing projects, tasks, updates, meetings, announcements, documents, and team records.

## ✨ Features

- **Dashboard UI** — Clean, responsive interface built from a modern design.
- **Task management** — Create and track tasks across your team.
- **Real accounts** — Email + password authentication with hashed passwords and session tokens. No more name-only login.
- **Workspace access checks** — Every API request is validated against workspace membership; admin actions require an owner/admin role.
- **SQLite behind an API** — The browser never touches the database. All data flows through the backend, which owns the SQLite file.
- **Migration-ready** — Explicit SQL migrations, stable text IDs, ISO-8601 timestamps, and a repository layer that isolates SQLite from business logic, so a later move to Supabase only touches the backend.

## 🧰 Stack

- **React 19** + **Vite** for the UI
- **Lucide React** for icons
- **Express** for the backend API
- **better-sqlite3** for storage
- **bcryptjs** for password hashing

## 🚀 Getting Started

```powershell
npm install
npm run dev
```

This starts two processes:

1. **API server** on `http://localhost:3001` — applies database migrations on first run and creates `server/data/teamops.db`.
2. **Vite dev server** on `http://localhost:5173` — proxies `/api` requests to the API server.

Open http://localhost:5173 and sign in with the seeded demo account:

```
Email:    marion@teamops.local
Password: password123
```

> Change the demo password before inviting a real team. You can register a new account from the login screen; new accounts start with no workspace, so create one from the workspace switcher.

### Production

```powershell
npm run build   # build the React app into dist/
npm start       # serve the API + built app from one process
```

The server serves the built frontend from `dist/` and the API from `/api`, so a single Node process is all you need on one host.

## 📁 Project Structure

```
├── server/             # Backend API
│   ├── db/
│   │   ├── migrations/ # SQL migrations, applied in order on server start
│   │   └── index.js    # SQLite connection + migration runner
│   ├── repositories/   # Data access layer (the only code that touches SQLite)
│   ├── routes/         # Express route handlers (auth, workspaces, projects, tasks, records)
│   ├── auth.js         # Session tokens + workspace access middleware
│   ├── app.js          # Express app
│   └── index.js        # Server entry point
├── src/                # React renderer (UI)
│   ├── auth/           # Auth context (login, register, session restore)
│   ├── hooks/          # useWorkspaceData — loads workspace data through the API
│   └── lib/            # API client
└── supabase/
    └── migrations/     # (Future) SQL migrations for a Supabase move
```

## 🔐 Authentication & Access

- Passwords are stored as bcrypt hashes; sessions are opaque bearer tokens.
- Every workspace-scoped route checks that the caller is a member of that workspace.
- Member management (invite, change role, remove) requires an owner or admin role.
- Deleting a workspace requires the owner role.

## 🗄️ Database & Migrations

Migrations live in `server/db/migrations/` and are applied automatically on server start, in filename order, inside transactions. Each applied file is recorded in `schema_migrations`.

Conventions that keep a future Supabase move cheap:

- **Stable text IDs** (`ws_default`, `prj_onboarding`) instead of auto-increment integers.
- **ISO-8601 UTC timestamps** matching Postgres output.
- **No SQLite-specific behavior in business logic** — it stays in migrations and the repository layer.

## ☁️ Moving to Supabase (later)

The UI depends only on the API client (`src/lib/api.js`). To move to Supabase:

1. Port the schema in `server/db/migrations/` to Postgres (see `supabase/migrations/`).
2. Replace the repository layer (`server/repositories/`) with Supabase queries, or swap the Express routes for Supabase Edge Functions.
3. Replace the session middleware with Supabase Auth (JWT) and RLS policies.
4. Keep the API contract stable so the frontend does not change.

## 🚧 Deployment Notes

SQLite is simplest when the app runs on **one server with persistent disk**. Choose hosting with a persistent volume (e.g. a single VM or a container with a mounted volume). Avoid platforms with ephemeral filesystems or multiple app instances until you migrate to Supabase.

Back up `server/data/teamops.db` regularly (the WAL mode makes file-level backups safe with `sqlite3 .backup` or a nightly copy).

## 📄 License

This project is private and not yet licensed for public distribution.
