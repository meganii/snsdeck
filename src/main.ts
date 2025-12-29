import { app, BrowserWindow, BrowserView, ipcMain, Rectangle } from 'electron';
import Store from 'electron-store';
import path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const store = new Store();

const columnWidth = 400;
const offset = 150;
const marginTop = 25;

// Variables to handle Vite paths
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

declare const MODAL_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MODAL_WINDOW_VITE_NAME: string;


// Preload paths
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string; // Keep for fallback if vite plugin generates this
// Actually vite plugin generates paths like:
// MAIN_WINDOW_PRELOAD_VITE_ENTRY (if it was a single entry) but for multiple preloads it might be different.
// The config shows:
// entry: 'src/preload.ts', config: 'vite.preload.config.ts'
// So it will be available as `PRELOAD_VITE_ENTRY`? No.
// When using `build` array in forge config, the magic constants are generated based on entry names.
// However, the standard vite plugin behavior for preloads isn't just one constant if multiple are defined.
// Let's assume standard behavior:
// 'src/preload.ts' -> PRELOAD_VITE_ENTRY (if name not specified, maybe base filename?)
// Let's check how we named them. We didn't give names in the array, just entry paths.
// But we can import them? No, they are built separately.

// Let's use `path.join(__dirname, 'preload.js')` style but pointing to the output.
// With Vite plugin, `__dirname` in main process points to `.vite/build`.
// The preloads are built to `.vite/build/preload.js`, `.vite/build/preload-page.js`, etc.
// So `path.join(__dirname, 'preload.js')` should work if we are in the build output.

// However, during dev, it might be different.
// The Vite plugin defines magic constants for preloads.
// Let's try to verify what constants are available.
// Usually for `entry: 'src/preload.ts'`, the constant is `PRELOAD_VITE_ENTRY` if it's the only one or named 'preload'.
// But we have multiple.
// Let's assume they are built to the same directory as main.js.

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // verify this later
    },
  });

  // Load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  win.webContents.on('did-finish-load', () => {
    const columns = store.get('columns') as any[];
    if (columns) {
      loadPages(win, columns);
    }

    ipcMain.on('addColumn', handleAddColumn);

    ipcMain.on('openAddColumn', (_event) => {
      openAddColumn(win);
    });

    ipcMain.on('openRemoveColumn', handleRemoveColumn);
  });

  function handleAddColumn(_event: any, column: any) {
    const views = win.getBrowserViews();
    const { height } = win.getBounds();
    let lastCol: Rectangle;
    if (views.length === 0) {
      lastCol = { x: -columnWidth + offset, y: marginTop, width: columnWidth, height: height };
    } else {
      lastCol = views[views.length - 1].getBounds();
    }
    const col = { url: column.url, css: column.css, partition: column.partition };
    let columns = store.get('columns') as any[];

    if (columns) {
      columns.push(col);
    } else {
      columns = [col];
    }
    store.set('columns', columns);
    loadPage(win, { x: lastCol.x + columnWidth, y: lastCol.y, width: columnWidth, height: height }, col);
    win.webContents.send('onAddColumn');
  }

  function handleRemoveColumn(_event: any, indexOfColumn: number) {
    const views = win.getBrowserViews();
    console.log(views);
    win.removeBrowserView(views[indexOfColumn]);
    const newViews: BrowserView[] = [];
    for (let i = indexOfColumn + 1; i < views.length; i++) {
      console.log(`from handleRemoveColumn`, i);
      const v = views[i];
      const { x, y, width, height } = v.getBounds();
      v.setBounds({ x: x - columnWidth, y: y, width: width, height: height });
      win.removeBrowserView(v);
      newViews.push(v);
    }
    for (const view of newViews) {
      win.addBrowserView(view);
    }

    const columns = store.get('columns') as any[];
    const newColumns = columns.filter((_v, i) => i !== indexOfColumn);
    store.set('columns', newColumns);
  }

  ipcMain.on('wheel-event', (_event, deltaX, _deltaY, _deltaZ) => {
    win.webContents.send('scroll', deltaX);
    console.log(`ipcMain`, deltaX);
    for (const view of win.getBrowserViews()) {
      const { x, y, width, height } = view.getBounds();
      view.setBounds({ x: x - deltaX, y: y, width: width, height: height });
    }
  });
}

function loadPages(window: BrowserWindow, columns: any[]) {
  window.webContents.send('onload', columns.length);
  const { height } = window.getBounds();
  for (let i = 0; i < columns.length; i++) {
    loadPage(window, { x: i * columnWidth + offset, y: marginTop, width: columnWidth, height: height - marginTop }, columns[i]);
  }
}

function loadPage(window: BrowserWindow, bounds: Rectangle, column: any) {
  const { url, css, js } = column;
  const view = createBrowserView(column);
  window.addBrowserView(view);
  view.setBounds(bounds);
  view.setBackgroundColor('#bfc4cf');
  view.webContents.loadURL(url);
  view.setAutoResize({ width: false, height: true });

  view.webContents.on('did-finish-load', () => {
    view.webContents.insertCSS('::-webkit-scrollbar {display: none !important;}' + css);
    if (js !== undefined && js !== '') {
      view.webContents.executeJavaScript(js, true);
    }
  });
}

function createBrowserView(column: any) {
  const { partition } = column;

  const webPreferences: Electron.WebPreferences = {
    preload: path.join(__dirname, 'preload-page.js'),
  };

  if (partition !== undefined && partition !== '') {
    webPreferences.partition = `persist:${partition}`;
  }

  return new BrowserView({ webPreferences: webPreferences });
}

function openAddColumn(window: BrowserWindow) {
  const modal = new BrowserWindow({
    parent: window,
    show: false,
    width: 500,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, 'preload-modal.js'),
    },
  });

  if (MODAL_WINDOW_VITE_DEV_SERVER_URL) {
    modal.loadURL(MODAL_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // modal.html is likely in the same dir as index.html in the renderer build
    // But since it is a multi-page entry, it might be in a different structure?
    // Vite builds MPA into `index.html` and `modal.html` in the root of outDir.
    // So it should be `../renderer/main_window/modal.html` if they share the config.
    // Wait, in `vite.renderer.config.ts`, I defined input for both.
    // So they will be in `.vite/renderer/main_window/`.
    // The `MAIN_WINDOW_VITE_NAME` is `main_window`.
    modal.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/modal.html`));
  }

  modal.once('ready-to-show', () => {
    modal.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
