import { randomUUID } from 'node:crypto'
import { getDatabase } from '../db/index.js'

const now = () => new Date().toISOString()

function mapUser(row) {
  if (!row) return null
  return { id: row.id, name: row.name, email: row.email, role: row.role, active: Boolean(row.active), createdAt: row.created_at, updatedAt: row.updated_at }
}

function mapWorkspace(row) {
  if (!row) return null
  return { id: row.id, name: row.name, description: row.description, createdAt: row.created_at, updatedAt: row.updated_at }
}

function mapProject(row) {
  if (!row) return null
  return { id: row.id, workspaceId: row.workspace_id, name: row.name, description: row.description, status: row.status, progress: row.progress, priority: row.priority, deadline: row.deadline, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at }
}

function mapTask(row) {
  if (!row) return null
  return { id: row.id, workspaceId: row.workspace_id, projectId: row.project_id, title: row.title, description: row.description, status: row.status, priority: row.priority, dueDate: row.due_date, assigneeId: row.assignee_id, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at }
}

function mapRecord(row) {
  if (!row) return null
  return { id: row.id, workspaceId: row.workspace_id, page: row.page, title: row.title, description: row.description, createdBy: row.created_by, createdAt: row.created_at }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function findUserByEmail(email) {
  return mapUser(getDatabase().prepare('select * from users where email = ?').get(email))
}

export function findUserById(id) {
  return mapUser(getDatabase().prepare('select * from users where id = ?').get(id))
}

export function createUser({ name, email, passwordHash, role = 'member' }) {
  const result = getDatabase().prepare('insert into users (name, email, password_hash, role) values (?, ?, ?, ?)').run(name, email, passwordHash, role)
  return findUserById(result.lastInsertRowid)
}

export function updateUserProfile(id, { name }) {
  getDatabase().prepare('update users set name = ?, updated_at = ? where id = ?').run(name, now(), id)
  return findUserById(id)
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export function listWorkspacesForUser(userId) {
  return getDatabase().prepare(`
    select w.* from workspaces w
    join workspace_members wm on wm.workspace_id = w.id
    where wm.user_id = ?
    order by w.created_at asc
  `).all(userId).map(mapWorkspace)
}

export function findWorkspaceById(id) {
  return mapWorkspace(getDatabase().prepare('select * from workspaces where id = ?').get(id))
}

export function createWorkspace({ id = randomUUID(), name, description = null, ownerId }) {
  const db = getDatabase()
  const run = db.transaction(() => {
    db.prepare('insert into workspaces (id, name, description) values (?, ?, ?)').run(id, name, description)
    db.prepare('insert into workspace_members (workspace_id, user_id, role) values (?, ?, ?)').run(id, ownerId, 'owner')
  })
  run()
  return findWorkspaceById(id)
}

export function updateWorkspace(id, { name, description }) {
  getDatabase().prepare('update workspaces set name = ?, description = ?, updated_at = ? where id = ?').run(name, description, now(), id)
  return findWorkspaceById(id)
}

export function deleteWorkspace(id) {
  getDatabase().prepare('delete from workspaces where id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Workspace membership
// ---------------------------------------------------------------------------

export function findMembership(workspaceId, userId) {
  return getDatabase().prepare('select * from workspace_members where workspace_id = ? and user_id = ?').get(workspaceId, userId)
}

export function listMembers(workspaceId) {
  return getDatabase().prepare(`
    select u.id, u.name, u.email, u.role as user_role, u.active, u.created_at, wm.role as workspace_role, wm.created_at as joined_at
    from workspace_members wm
    join users u on u.id = wm.user_id
    where wm.workspace_id = ?
    order by wm.created_at asc
  `).all(workspaceId).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.workspace_role,
    active: Boolean(row.active),
    joinedAt: row.joined_at,
  }))
}

export function addMember(workspaceId, userId, role = 'member') {
  getDatabase().prepare('insert or ignore into workspace_members (workspace_id, user_id, role) values (?, ?, ?)').run(workspaceId, userId, role)
}

export function updateMemberRole(workspaceId, userId, role) {
  getDatabase().prepare('update workspace_members set role = ? where workspace_id = ? and user_id = ?').run(role, workspaceId, userId)
}

export function removeMember(workspaceId, userId) {
  getDatabase().prepare('delete from workspace_members where workspace_id = ? and user_id = ?').run(workspaceId, userId)
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function listProjects(workspaceId) {
  return getDatabase().prepare('select * from projects where workspace_id = ? order by created_at asc').all(workspaceId).map(mapProject)
}

export function findProjectById(id) {
  return mapProject(getDatabase().prepare('select * from projects where id = ?').get(id))
}

export function createProject({ id = randomUUID(), workspaceId, name, description = null, status = 'Planning', progress = 0, priority = 'Medium', deadline = null, createdBy }) {
  getDatabase().prepare(`
    insert into projects (id, workspace_id, name, description, status, progress, priority, deadline, created_by)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, workspaceId, name, description, status, progress, priority, deadline, createdBy)
  return findProjectById(id)
}

export function updateProject(id, fields) {
  const allowed = ['name', 'description', 'status', 'progress', 'priority', 'deadline']
  const sets = allowed.filter((key) => fields[key] !== undefined).map((key) => `${key} = ?`)
  if (sets.length === 0) return findProjectById(id)
  const values = allowed.filter((key) => fields[key] !== undefined).map((key) => fields[key])
  getDatabase().prepare(`update projects set ${sets.join(', ')}, updated_at = ? where id = ?`).run(...values, now(), id)
  return findProjectById(id)
}

export function deleteProject(id) {
  getDatabase().prepare('delete from projects where id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function listTasks(workspaceId, { projectId } = {}) {
  if (projectId) return getDatabase().prepare('select * from tasks where workspace_id = ? and project_id = ? order by created_at asc').all(workspaceId, projectId).map(mapTask)
  return getDatabase().prepare('select * from tasks where workspace_id = ? order by created_at asc').all(workspaceId).map(mapTask)
}

export function findTaskById(id) {
  return mapTask(getDatabase().prepare('select * from tasks where id = ?').get(id))
}

export function createTask({ id = randomUUID(), workspaceId, projectId = null, title, description = null, status = 'To Do', priority = 'Medium', dueDate = null, assigneeId = null, createdBy }) {
  getDatabase().prepare(`
    insert into tasks (id, workspace_id, project_id, title, description, status, priority, due_date, assignee_id, created_by)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, workspaceId, projectId, title, description, status, priority, dueDate, assigneeId, createdBy)
  return findTaskById(id)
}

export function updateTask(id, fields) {
  const allowed = ['title', 'description', 'status', 'priority', 'due_date', 'assignee_id', 'project_id']
  const sets = allowed.filter((key) => fields[key] !== undefined).map((key) => `${key} = ?`)
  if (sets.length === 0) return findTaskById(id)
  const values = allowed.filter((key) => fields[key] !== undefined).map((key) => fields[key])
  getDatabase().prepare(`update tasks set ${sets.join(', ')}, updated_at = ? where id = ?`).run(...values, now(), id)
  return findTaskById(id)
}

export function deleteTask(id) {
  getDatabase().prepare('delete from tasks where id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Workspace records (updates, meetings, announcements, documents, team notes)
// ---------------------------------------------------------------------------

const RECORD_PAGES = ['Team', 'Projects', 'Tasks', 'Updates', 'Meetings', 'Announcements', 'Documents']

export function listRecords(workspaceId, { page } = {}) {
  if (page) return getDatabase().prepare('select * from workspace_records where workspace_id = ? and page = ? order by created_at asc').all(workspaceId, page).map(mapRecord)
  return getDatabase().prepare('select * from workspace_records where workspace_id = ? order by created_at asc').all(workspaceId).map(mapRecord)
}

export function createRecord({ id = randomUUID(), workspaceId, page, title, description = null, createdBy }) {
  if (!RECORD_PAGES.includes(page)) throw new Error(`Invalid page: ${page}`)
  getDatabase().prepare('insert into workspace_records (id, workspace_id, page, title, description, created_by) values (?, ?, ?, ?, ?, ?)').run(id, workspaceId, page, title, description, createdBy)
  return findRecordById(id)
}

export function findRecordById(id) {
  return mapRecord(getDatabase().prepare('select * from workspace_records where id = ?').get(id))
}

export function deleteRecord(id) {
  getDatabase().prepare('delete from workspace_records where id = ?').run(id)
}