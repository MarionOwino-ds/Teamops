import { Router } from 'express'
import { requireAuth, requireWorkspaceMember } from '../auth.js'
import { createRecord, deleteRecord, findRecordById, listRecords } from '../repositories/index.js'

const router = Router()

router.use(requireAuth)
router.use('/:workspaceId', requireWorkspaceMember)

// GET /api/workspaces/:workspaceId/records?page=Updates
router.get('/:workspaceId/records', (req, res) => {
  const { page } = req.query
  res.json({ records: listRecords(req.params.workspaceId, { page }) })
})

// POST /api/workspaces/:workspaceId/records
router.post('/:workspaceId/records', (req, res) => {
  const { page, title, description } = req.body || {}
  if (!page || typeof page !== 'string') return res.status(400).json({ error: 'Page is required' })
  if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Title is required' })
  try {
    const record = createRecord({ workspaceId: req.params.workspaceId, page, title: title.trim(), description: description || null, createdBy: req.user.id })
    res.status(201).json({ record })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/workspaces/:workspaceId/records/:recordId
router.delete('/:workspaceId/records/:recordId', (req, res) => {
  const record = findRecordById(req.params.recordId)
  if (!record || record.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Record not found' })
  deleteRecord(req.params.recordId)
  res.json({ ok: true })
})

export default router