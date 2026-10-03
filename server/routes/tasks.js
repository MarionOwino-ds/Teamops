import { Router } from 'express'
import { requireAuth, requireWorkspaceMember } from '../auth.js'
import { createTask, deleteTask, findTaskById, listTasks, updateTask } from '../repositories/index.js'

const router = Router()

router.use(requireAuth)
router.use('/:workspaceId', requireWorkspaceMember)

// GET /api/workspaces/:workspaceId/tasks?projectId=...
router.get('/:workspaceId/tasks', (req, res) => {
  const { projectId } = req.query
  res.json({ tasks: listTasks(req.params.workspaceId, { projectId }) })
})

// POST /api/workspaces/:workspaceId/tasks
router.post('/:workspaceId/tasks', (req, res) => {
  const { title, description, projectId, status, priority, dueDate, assigneeId } = req.body || {}
  if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Task title is required' })
  const task = createTask({
    workspaceId: req.params.workspaceId,
    projectId: projectId || null,
    title: title.trim(),
    description: description || null,
    status,
    priority,
    dueDate,
    assigneeId,
    createdBy: req.user.id,
  })
  res.status(201).json({ task })
})

// GET /api/workspaces/:workspaceId/tasks/:taskId
router.get('/:workspaceId/tasks/:taskId', (req, res) => {
  const task = findTaskById(req.params.taskId)
  if (!task || task.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Task not found' })
  res.json({ task })
})

// PATCH /api/workspaces/:workspaceId/tasks/:taskId
router.patch('/:workspaceId/tasks/:taskId', (req, res) => {
  const task = findTaskById(req.params.taskId)
  if (!task || task.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Task not found' })
  const updated = updateTask(req.params.taskId, req.body || {})
  res.json({ task: updated })
})

// DELETE /api/workspaces/:workspaceId/tasks/:taskId
router.delete('/:workspaceId/tasks/:taskId', (req, res) => {
  const task = findTaskById(req.params.taskId)
  if (!task || task.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Task not found' })
  deleteTask(req.params.taskId)
  res.json({ ok: true })
})

export default router