const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('node:path')
const { initializeDatabase } = require('./database.cjs')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#f8fafb',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  initializeDatabase(app.getPath('userData'))
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'TeamOps', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] }, { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }] }]))
  ipcMain.handle('app:metadata', () => ({ version: app.getVersion(), userDataPath: app.getPath('userData') }))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })