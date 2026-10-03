import crypto from 'node:crypto'
import { getDatabase } from './db/index.js'
import { findMembership, findUserById } from './repositories/index.js'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

// Sessions are persisted in SQLite (hashed tokens) so users stay signed in
// across server restarts. When the app moves to Supabase, replace this with
// Supabase Auth JWTs.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  getDatabase().prepare('insert into sessions (token_hash, user_id, expires_at) values (?, ?, ?)').run(hashToken(token), userId, expiresAt)
  return token
}

export function destroySession(token) {
  getDatabase().prepare('delete from sessions where token_hash = ?').run(hashToken(token))
}

export function getSessionUser(token) {
  if (!token) return null
  const session = getDatabase().prepare('select * from sessions where token_hash = ?').get(hashToken(token))
  if (!session) return null
  if (new Date(session.expires_at).getTime() < Date.now()) {
    getDatabase().prepare('delete from sessions where token_hash = ?').run(hashToken(token))
    return null
  }
  return findUserById(session.user_id)
}

/** Express middleware: requires a valid session token in the Authorization header. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const user = getSessionUser(token)
  if (!user) return res.status(401).json({ error: 'Authentication required' })
  req.user = user
  req.sessionToken = token
  next()
}

/** Express middleware: requires the user to be a member of the workspace in :workspaceId. */
export function requireWorkspaceMember(req, res, next) {
  const { workspaceId } = req.params
  const membership = req.user && workspaceId ? findMembership(workspaceId, req.user.id) : null
  if (!membership) return res.status(403).json({ error: 'You do not have access to this workspace' })
  req.membership = membership
  next()
}

/** Express middleware: requires an owner or admin role in the current workspace. */
export function requireWorkspaceAdmin(req, res, next) {
  if (!req.membership || !['owner', 'admin'].includes(req.membership.role)) {
    return res.status(403).json({ error: 'Workspace admin access required' })
  }
  next()
}