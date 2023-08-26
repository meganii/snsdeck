const { ipcRenderer, contextBridge } = require('electron')

document.addEventListener('wheel', (event) => {
    ipcRenderer.send('wheel-event', event.deltaX, event.deltaY, event.deltaZ)
})

contextBridge.exposeInMainWorld('snsdeck', {
    openAddColumn: () => {
        console.log('openAddColumn')
        ipcRenderer.send('openAddColumn')
    },
    openRemoveColumn: () => {
        console.log('openRemoveColumn')
        ipcRenderer.send('Close')
    },
    onScroll: (callback) => ipcRenderer.on('scroll', callback)
})