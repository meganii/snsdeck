import { ipcRenderer, contextBridge } from 'electron';

document.addEventListener('wheel', (event) => {
    ipcRenderer.send('wheel-event', event.deltaX, event.deltaY, event.deltaZ);
});

contextBridge.exposeInMainWorld('snsdeck', {
    openAddColumn: () => {
        console.log('openAddColumn');
        ipcRenderer.send('openAddColumn');
    },
    openRemoveColumn: (indexOfColumn: number) => {
        console.log('openRemoveColumn', indexOfColumn);
        ipcRenderer.send('openRemoveColumn', indexOfColumn);
    },
    onScroll: (callback: (event: Electron.IpcRendererEvent, deltaX: number) => void) => ipcRenderer.on('scroll', callback),
    onLoadColumns: (callback: (event: Electron.IpcRendererEvent, numOfColumn: number) => void) => ipcRenderer.on('onload', callback),
    onAddColumn: (callback: (event: Electron.IpcRendererEvent) => void) => ipcRenderer.on('onAddColumn', callback),
});
