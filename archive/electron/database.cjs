const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

let database

function initializeDatabase(userDataPath) {
  const databaseDirectory = path.join(userDataPath, 'data')
  fs.mkdirSync(databaseDirectory, { recursive: true })
  database = new Database(path.join(databaseDirectory, 'teamops.db'))
  database.pragma('foreign_keys = ON')
  database.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'Planning', progress INTEGER NOT NULL DEFAULT 0, priority TEXT NOT NULL DEFAULT 'Medium', deadline TEXT, owner_id INTEGER REFERENCES users(id)); CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT, project_id INTEGER REFERENCES projects(id), assignee_id INTEGER REFERENCES users(id), creator_id INTEGER REFERENCES users(id), status TEXT NOT NULL DEFAULT 'To Do', priority TEXT NOT NULL DEFAULT 'Medium', due_date TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id); CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);`)
  return database
}

module.exports = { initializeDatabase, getDatabase: () => database }