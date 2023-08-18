const { ipcRenderer, contextBridge } = require('electron')

document.addEventListener('wheel', (event) => {
    ipcRenderer.send('wheel-event', event.deltaX, event.deltaY, event.deltaZ)
})

contextBridge.exposeInMainWorld('snsdeck', {
    addColumn: (column) => {
        console.log('addColumn')
        ipcRenderer.send('addColumn', column)
    },
    openAddColumn: () => {
        console.log('openAddColumn')
        ipcRenderer.send('openAddColumn')
    }
})
