const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('snsdeck', {
    addColumn: (column) => {
        console.log('addColumn')
        ipcRenderer.send('addColumn', column)
    }
})