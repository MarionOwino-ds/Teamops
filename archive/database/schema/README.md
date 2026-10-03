# TeamOps database schema

The Electron database initializer creates the first local-first schema in the per-user application data directory. Future migrations should be added here and applied by `electron/database.js` before repositories are exposed to the renderer.