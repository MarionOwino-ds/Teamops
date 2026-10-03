import crypto from 'node:crypto'
import { findMembership, findUserById } from './repositories/index.js'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

// In-memory session store. For a single-server pilot this is fine; when the app
// moves to multiple instances or Supabase, swap this for a shared store.
const sessions = new Map()

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS })
  return token
}

export function destroySession(token) {
  sessions.delete(token)
}

export function getSessionUser(token) {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }
  return findUserById(session.userId)
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