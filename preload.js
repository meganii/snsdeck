const { ipcRenderer, contextBridge } = require('electron')

document.addEventListener('wheel', (event) => {
    ipcRenderer.send('wheel-event', event.deltaX, event.deltaY, event.deltaZ)
})

contextBridge.exposeInMainWorld('snsdeck', {
    openAddColumn: () => {
        console.log('openAddColumn')
        ipcRenderer.send('openAddColumn')
    },
    openRemoveColumn: (indexOfColumn) => {
        console.log('openRemoveColumn', indexOfColumn)
        ipcRenderer.send('openRemoveColumn', indexOfColumn)
    },
    onScroll: (callback) => ipcRenderer.on('scroll', callback),
    onLoadColumns: (callback) => ipcRenderer.on('onload', callback)
})