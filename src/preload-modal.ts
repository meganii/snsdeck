import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('snsdeck', {
    addColumn: (column: any) => {
        console.log('addColumn');
        ipcRenderer.send('addColumn', column);
    }
});
