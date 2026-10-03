import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

let database

/**
 * Opens (or creates) the SQLite database file and applies pending migrations.
 * The database lives in `server/data/teamops.db` by default; override with
 * TEAMOPS_DB_PATH (e.g. a persistent volume in production).
 */
export function initializeDatabase(dbPath = process.env.TEAMOPS_DB_PATH || path.join(__dirname, '..', 'data', 'teamops.db')) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  database = new Database(dbPath)
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')
  database.pragma('busy_timeout = 5000')
  runMigrations(database)
  return database
}

export function getDatabase() {
  if (!database) throw new Error('Database has not been initialized')
  return database
}

function runMigrations(db) {
  db.exec(`create table if not exists schema_migrations (
    filename text primary key,
    applied_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`)

  const applied = new Set(db.prepare('select filename from schema_migrations').all().map((row) => row.filename))
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort()

  for (const filename of files) {
    if (applied.has(filename)) continue
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8')
    const run = db.transaction(() => {
      db.exec(sql)
      db.prepare('insert into schema_migrations (filename) values (?)').run(filename)
    })
    run()
    console.log(`[db] applied migration ${filename}`)
  }
}