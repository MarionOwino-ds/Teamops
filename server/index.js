import { initializeDatabase } from './db/index.js'
import { createApp } from './app.js'

const PORT = Number(process.env.PORT || 3001)

initializeDatabase()
const app = createApp()

app.listen(PORT, () => {
  console.log(`[api] TeamOps API listening on http://localhost:${PORT}`)
})