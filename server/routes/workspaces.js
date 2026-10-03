import { Router } from 'express'
import { requireAuth, requireWorkspaceAdmin, requireWorkspaceMember } from '../auth.js'
import {
  addMember,
  createWorkspace,
  deleteWorkspace,
  findUserByEmail,
  findWorkspaceById,
  listMembers,
  listWorkspacesForUser,
  removeMember,
  updateMemberRole,
  updateWorkspace,
} from '../repositories/index.js'

const router = Router()

router.use(requireAuth)

// GET /api/workspaces — workspaces the current user belongs to
router.get('/', (req, res) => {
  res.json({ workspaces: listWorkspacesForUser(req.user.id) })
})

// POST /api/workspaces — create a workspace (creator becomes owner)
router.post('/', (req, res) => {
  const { name, description } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Workspace name is required' })
  const workspace = createWorkspace({ name: name.trim(), description: description || null, ownerId: req.user.id })
  res.status(201).json({ workspace })
})

// All routes below operate on a specific workspace and require membership.
router.use('/:workspaceId', requireWorkspaceMember)

// GET /api/workspaces/:workspaceId
router.get('/:workspaceId', (req, res) => {
  res.json({ workspace: findWorkspaceById(req.params.workspaceId) })
})

// PATCH /api/workspaces/:workspaceId — rename or update the workspace
router.patch('/:workspaceId', requireWorkspaceAdmin, (req, res) => {
  const { name, description } = req.body || {}
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) return res.status(400).json({ error: 'Workspace name is required' })
  const workspace = updateWorkspace(req.params.workspaceId, {
    name: name !== undefined ? name.trim() : undefined,
    description: description !== undefined ? description : undefined,
  })
  res.json({ workspace })
})

// DELETE /api/workspaces/:workspaceId — owner only
router.delete('/:workspaceId', requireWorkspaceAdmin, (req, res) => {
  if (req.membership.role !== 'owner') return res.status(403).json({ error: 'Only the workspace owner can delete the workspace' })
  deleteWorkspace(req.params.workspaceId)
  res.json({ ok: true })
})

// GET /api/workspaces/:workspaceId/members
router.get('/:workspaceId/members', (req, res) => {
  res.json({ members: listMembers(req.params.workspaceId) })
})

// POST /api/workspaces/:workspaceId/members — invite by email (admin+)
router.post('/:workspaceId/members', requireWorkspaceAdmin, (req, res) => {
  const { email, role = 'member' } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email is required' })
  if (!['member', 'admin'].includes(role)) return res.status(400).json({ error: 'Role must be member or admin' })

  const user = findUserByEmail(email.trim().toLowerCase())
  if (!user) return res.status(404).json({ error: 'No TeamOps account exists for that email. Ask them to register first.' })
  if (user.id === req.user.id) return res.status(400).json({ error: 'You are already a member of this workspace' })

  addMember(req.params.workspaceId, user.id, role)
  res.status(201).json({ member: { id: user.id, name: user.name, email: user.email, role, active: user.active, joinedAt: new Date().toISOString() } })
})

// PATCH /api/workspaces/:workspaceId/members/:userId — change role (admin+)
router.patch('/:workspaceId/members/:userId', requireWorkspaceAdmin, (req, res) => {
  const { role } = req.body || {}
  if (!['member', 'admin', 'owner'].includes(role)) return res.status(400).json({ error: 'Role must be member, admin, or owner' })
  updateMemberRole(req.params.workspaceId, Number(req.params.userId), role)
  res.json({ ok: true })
})

// DELETE /api/workspaces/:workspaceId/members/:userId — remove a member (admin+)
router.delete('/:workspaceId/members/:userId', requireWorkspaceAdmin, (req, res) => {
  const targetId = Number(req.params.userId)
  if (targetId === req.user.id) return res.status(400).json({ error: 'You cannot remove yourself' })
  removeMember(req.params.workspaceId, targetId)
  res.json({ ok: true })
})

export default router