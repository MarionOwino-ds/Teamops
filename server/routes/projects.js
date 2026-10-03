import { Router } from 'express'
import { requireAuth, requireWorkspaceMember } from '../auth.js'
import { createProject, deleteProject, findProjectById, listProjects, updateProject } from '../repositories/index.js'

const router = Router()

router.use(requireAuth)
router.use('/:workspaceId', requireWorkspaceMember)

// GET /api/workspaces/:workspaceId/projects
router.get('/:workspaceId/projects', (req, res) => {
  res.json({ projects: listProjects(req.params.workspaceId) })
})

// POST /api/workspaces/:workspaceId/projects
router.post('/:workspaceId/projects', (req, res) => {
  const { name, description, status, progress, priority, deadline } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Project name is required' })
  const project = createProject({
    workspaceId: req.params.workspaceId,
    name: name.trim(),
    description: description || null,
    status,
    progress,
    priority,
    deadline,
    createdBy: req.user.id,
  })
  res.status(201).json({ project })
})

// GET /api/workspaces/:workspaceId/projects/:projectId
router.get('/:workspaceId/projects/:projectId', (req, res) => {
  const project = findProjectById(req.params.projectId)
  if (!project || project.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Project not found' })
  res.json({ project })
})

// PATCH /api/workspaces/:workspaceId/projects/:projectId
router.patch('/:workspaceId/projects/:projectId', (req, res) => {
  const project = findProjectById(req.params.projectId)
  if (!project || project.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Project not found' })
  const updated = updateProject(req.params.projectId, req.body || {})
  res.json({ project: updated })
})

// DELETE /api/workspaces/:workspaceId/projects/:projectId
router.delete('/:workspaceId/projects/:projectId', (req, res) => {
  const project = findProjectById(req.params.projectId)
  if (!project || project.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Project not found' })
  deleteProject(req.params.projectId)
  res.json({ ok: true })
})

export default router