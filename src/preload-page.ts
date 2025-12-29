import { ipcRenderer } from 'electron';

document.addEventListener('wheel', (event) => {
    ipcRenderer.send('wheel-event', event.deltaX, event.deltaY, event.deltaZ);
});
