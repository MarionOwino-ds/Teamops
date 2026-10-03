import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { createSession, destroySession, requireAuth } from '../auth.js'
import { createUser, findUserByEmail, findUserById, updateUserProfile } from '../repositories/index.js'

const router = Router()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, createdAt: user.createdAt }
}

// POST /api/auth/register — create an account (no workspace yet)
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name is required' })
  if (!email || typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) return res.status(400).json({ error: 'A valid email is required' })
  if (!password || typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  if (findUserByEmail(email.trim().toLowerCase())) return res.status(409).json({ error: 'An account with that email already exists' })

  const passwordHash = bcrypt.hashSync(password, 10)
  const user = createUser({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash })
  const token = createSession(user.id)
  res.status(201).json({ token, user: publicUser(user) })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const user = findUserByEmail(String(email).trim().toLowerCase())
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  if (!user.active) return res.status(403).json({ error: 'This account has been deactivated' })

  const token = createSession(user.id)
  res.json({ token, user: publicUser(user) })
})

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  destroySession(req.sessionToken)
  res.json({ ok: true })
})

// GET /api/auth/me — restore the session on page load
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

// PATCH /api/auth/me — update profile (name for now)
router.patch('/me', requireAuth, (req, res) => {
  const { name } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name is required' })
  const user = updateUserProfile(req.user.id, { name: name.trim() })
  res.json({ user: publicUser(user) })
})

export default router