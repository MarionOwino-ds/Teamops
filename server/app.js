import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.js'
import workspaceRoutes from './routes/workspaces.js'
import projectRoutes from './routes/projects.js'
import taskRoutes from './routes/tasks.js'
import recordRoutes from './routes/records.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'teamops-api', time: new Date().toISOString() })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/workspaces', workspaceRoutes)
  app.use('/api/workspaces', projectRoutes)
  app.use('/api/workspaces', taskRoutes)
  app.use('/api/workspaces', recordRoutes)

  // Serve the built React app in production (single-server deployment).
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  // JSON 404 for unknown API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  // Central error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[api] error:', err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}