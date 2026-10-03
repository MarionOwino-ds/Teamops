-- TeamOps seed data — migration 002
-- Creates the default workspace and a demo owner account so the app is usable
-- immediately after first run. Safe to re-run: guarded by existence checks.

-- Demo owner account (password: "password123" — change it before inviting a real team).
insert or ignore into users (id, name, email, password_hash, role)
select 1, 'Marion', 'marion@teamops.local', '$2b$10$XBZv0GPlKQLlmmMJS9YNJeWa6ZWJ9eO42KkLo9sPlSyeJVXEJIAzy', 'owner'
where not exists (select 1 from users where email = 'marion@teamops.local');

-- Default workspace.
insert or ignore into workspaces (id, name, description)
select 'ws_default', 'TeamOps Workspace', 'Default workspace for the TeamOps pilot.'
where not exists (select 1 from workspaces where id = 'ws_default');

-- Make the demo owner a member of the default workspace.
insert or ignore into workspace_members (workspace_id, user_id, role)
select 'ws_default', 1, 'owner'
where not exists (select 1 from workspace_members where workspace_id = 'ws_default' and user_id = 1);

-- A couple of starter projects so the dashboard has something to show.
insert or ignore into projects (id, workspace_id, name, description, status, progress, priority, created_by)
select 'prj_onboarding', 'ws_default', 'Team Onboarding', 'Get the pilot team set up in TeamOps.', 'Active', 40, 'High', 1
where not exists (select 1 from projects where id = 'prj_onboarding');

insert or ignore into projects (id, workspace_id, name, description, status, progress, priority, created_by)
select 'prj_dashboard', 'ws_default', 'Dashboard Refresh', 'Polish the dashboard for the pilot.', 'Planning', 10, 'Medium', 1
where not exists (select 1 from projects where id = 'prj_dashboard');

-- Starter tasks.
insert or ignore into tasks (id, workspace_id, project_id, title, description, status, priority, assignee_id, created_by)
select 'tsk_invite', 'ws_default', 'prj_onboarding', 'Invite the pilot team', 'Add team members and assign roles.', 'To Do', 'High', 1, 1
where not exists (select 1 from tasks where id = 'tsk_invite');

insert or ignore into tasks (id, workspace_id, project_id, title, description, status, priority, assignee_id, created_by)
select 'tsk_backup', 'ws_default', 'prj_onboarding', 'Set up database backups', 'Schedule a nightly backup of the SQLite file.', 'In Progress', 'High', 1, 1
where not exists (select 1 from tasks where id = 'tsk_backup');

insert or ignore into tasks (id, workspace_id, project_id, title, description, status, priority, assignee_id, created_by)
select 'tsk_theme', 'ws_default', 'prj_dashboard', 'Review dashboard theme', 'Collect feedback on the current theme.', 'To Do', 'Medium', 1, 1
where not exists (select 1 from tasks where id = 'tsk_theme');