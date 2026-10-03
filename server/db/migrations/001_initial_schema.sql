-- TeamOps SQLite schema — migration 001
-- Applied by server/db/migrate.js. Keep this file append-only; add new migrations
-- as new numbered files instead of editing applied ones.

PRAGMA foreign_keys = ON;

-- Users: one row per account. Passwords are stored as bcrypt hashes only.
create table if not exists users (
  id            integer primary key autoincrement,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'member' check (role in ('owner', 'admin', 'member')),
  active        integer not null default 1 check (active in (0, 1)),
  created_at    text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Workspaces: top-level containers that own projects, tasks, and records.
create table if not exists workspaces (
  id          text primary key,
  name        text not null,
  description text,
  created_at  text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Workspace membership: which users belong to which workspace, and their role.
create table if not exists workspace_members (
  workspace_id text not null references workspaces(id) on delete cascade,
  user_id      integer not null references users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (workspace_id, user_id)
);

-- Projects: belong to a workspace.
create table if not exists projects (
  id           text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  status       text not null default 'Planning' check (status in ('Planning', 'Active', 'On Hold', 'Completed')),
  progress     integer not null default 0 check (progress between 0 and 100),
  priority     text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  deadline     text,
  created_by   integer references users(id) on delete set null,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Tasks: belong to a project (or a workspace directly when project_id is null).
create table if not exists tasks (
  id           text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  project_id   text references projects(id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null default 'To Do' check (status in ('To Do', 'In Progress', 'Done')),
  priority     text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  due_date     text,
  assignee_id  integer references users(id) on delete set null,
  created_by   integer references users(id) on delete set null,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Generic workspace records (updates, meetings, announcements, documents, team notes).
create table if not exists workspace_records (
  id           text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  page         text not null check (page in ('Team', 'Projects', 'Tasks', 'Updates', 'Meetings', 'Announcements', 'Documents')),
  title        text not null check (length(trim(title)) > 0),
  description  text,
  created_by   integer references users(id) on delete set null,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Indexes for the queries the API runs most often.
create index if not exists idx_workspace_members_user on workspace_members(user_id);
create index if not exists idx_projects_workspace on projects(workspace_id);
create index if not exists idx_tasks_workspace on tasks(workspace_id);
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_assignee on tasks(assignee_id);
create index if not exists idx_records_workspace on workspace_records(workspace_id);
create index if not exists idx_records_page on workspace_records(page);