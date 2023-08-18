const { app, BrowserWindow, BrowserView, ipcMain } = require('electron')
const Store = require('electron-store')
const store = new Store()

const path = require('path')

const columnWidth = 400
const offset = 150

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload-page.js')
    }
  });

  win.loadFile('index.html')

  win.webContents.on('did-finish-load', () => {
    const columns = store.get('columns')

    if (columns) {
      loadPages(win, columns)
    }

    ipcMain.on('addColumn', handleAddCoulmn)
  
    ipcMain.on('openAddColumn', (event) => {
      openAddColumn(win)
    })
  })
  
  function handleAddCoulmn(event, column) {
    const views = win.getBrowserViews()
    let lastCol
    if(views.length === 0) {
      lastCol = {x: -columnWidth + offset, y:0, width: columnWidth, height: 600}
    } else {
      lastCol = views[views.length-1].getBounds()
    }
    const col = {url: column.url, css: column.css}
    let columns = store.get('columns')

    if(columns) {
      columns.push(col)
    } else {
      columns = [col]
    }
    store.set('columns', columns)
    loadPage(win, column.url, {x: lastCol.x + columnWidth, y: lastCol.y, width: columnWidth, height: lastCol.height}, column.css)
  }

  ipcMain.on('wheel-event', (event, deltaX, deltaY, deltaZ) => {
    for (const view of win.getBrowserViews()) {
      const {x, y, width, height} = view.getBounds()
      view.setBounds({ x: x - deltaX, y: y, width: width, height: height })
    }
  })
}

function loadPages(window, urls) {
  for (let i = 0; i < urls.length; i++) {
    const {url, css} = urls[i]
    loadPage(window, url, { x: i * columnWidth + offset, y: 0, width: columnWidth, height: 800 }, css)
  }
}

function loadPage(window, url, bounds, css, js) {
  const view = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload-page.js')
    }
  });
  window.addBrowserView(view);
  view.setBounds(bounds);
  view.setBackgroundColor("#bfc4cf")
  view.webContents.loadURL(url);
  view.setAutoResize({ width: false, height: true });
  
  view.webContents.on('did-finish-load', () => {
    view.webContents.insertCSS("::-webkit-scrollbar {display: none !important;}" + css)
  })
}

function openAddColumn(window) {
  const modal = new BrowserWindow({
    parent: window,
    show: false,
    width: 500,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, 'preload-page.js')
    }
  })
  modal.loadFile('modal.html')
  modal.once('ready-to-show', () => {
    modal.show()
  })
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