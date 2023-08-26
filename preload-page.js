const { ipcRenderer } = require('electron')

document.addEventListener('wheel', (event) => {
    ipcRenderer.send('wheel-event', event.deltaX, event.deltaY, event.deltaZ)
})