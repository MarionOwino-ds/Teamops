const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('teamOps', {
  getMetadata: () => ipcRenderer.invoke('app:metadata'),
})