# TeamOps

TeamOps is a lightweight, local-first operations hub for small software teams. It combines a polished dashboard UI with a secure Electron shell, giving teams a fast, private workspace for managing projects, tasks, updates, meetings, announcements, documents, and team records.

## ✨ Features

- **Dashboard UI** — Clean, responsive interface built from a modern design.
- **Task management** — Create and track tasks across your team.
- **Local-first storage** — Data persists locally via SQLite, surviving app updates.
- **Optional shared data** — Sync projects, tasks, updates, meetings, announcements, documents, and team records through Supabase when configured.
- **Secure Electron shell** — Desktop app boundary keeps the UI separate from the database layer.

## 🧰 Stack

- **React 19** + **Vite** for the UI
- **Lucide React** for icons
- **Electron** for the desktop shell
- **Node.js** + **better-sqlite3** for local storage
- **Supabase** for optional shared/cloud data

## 🚀 Getting Started

```powershell
npm install
npm run dev
```

The database is created in the Electron user data directory under `data/teamops.db` and survives application updates.

### Production builds

```powershell
npm run build      # build the renderer
npm run dist       # build + create a Windows installer (NSIS)
```

## 📁 Project Structure

```
├── electron/          # Electron main & preload scripts, local DB layer
├── database/          # Database schema
├── src/               # React renderer (UI)
│   ├── repositories/  # Data access layer
│   └── lib/           # Supabase client
├── supabase/
│   └── migrations/    # SQL migrations for shared data
└── public/            # Static assets
```

## ☁️ Enabling Shared (Supabase) Data

The app uses local storage when Supabase is not configured. To enable shared projects, tasks, updates, meetings, announcements, documents, and team records:

1. In Supabase, open **SQL Editor** and run [`supabase/migrations/001_workspace_records.sql`](supabase/migrations/001_workspace_records.sql).
2. Create a local `.env.local` file from [`.env.example`](.env.example).
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the values in Supabase **Project Settings > API**.
4. Restart the dev server with `npm run dev`.

For Vercel, add the same two values under **Project Settings > Environment Variables**, then redeploy. The anon key is intended for browser use — never put a Supabase service-role key in the frontend. The current name-only login is a lightweight team gate, not secure authentication, so use Supabase Auth before exposing sensitive company data publicly.

## 📄 License

This project is private and not yet licensed for public distribution.
