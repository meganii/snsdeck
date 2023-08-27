const { app, BrowserWindow, BrowserView, ipcMain } = require('electron')
const Store = require('electron-store')
const store = new Store()

const path = require('path')

const columnWidth = 400
const offset = 150
const marginTop = 25

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')

  win.webContents.on('did-finish-load', () => {
    const columns = store.get('columns')
    if (columns) {
      loadPages(win, columns)
    }

    ipcMain.on('addColumn', handleAddCoulmn)
  
    ipcMain.on('openAddColumn', (_event) => {
      openAddColumn(win)
    })

    ipcMain.on('openRemoveColumn', handleRemoveColumn)
  })
  
  function handleAddCoulmn(_event, column) {
    const views = win.getBrowserViews()
    const {height} = win.getBounds()
    let lastCol
    if(views.length === 0) {
      lastCol = {x: -columnWidth + offset, y: marginTop, width: columnWidth, height: height}
    } else {
      lastCol = views[views.length-1].getBounds()
    }
    const col = {url: column.url, css: column.css, partition: column.partition}
    let columns = store.get('columns')

    if(columns) {
      columns.push(col)
    } else {
      columns = [col]
    }
    store.set('columns', columns)
    loadPage(win, {x: lastCol.x + columnWidth, y: lastCol.y, width: columnWidth, height: height}, col)
    win.webContents.send('onAddColumn')
  }

  function handleRemoveColumn(_event, indexOfColumn) {
    const views = win.getBrowserViews()
    console.log(views)
    win.removeBrowserView(views[indexOfColumn])
    const newViews = []
    for (let i = indexOfColumn + 1; i < views.length; i++) {
      console.log(`from handleRemoveColumn`, i)
      const v = views[i]
      const {x, y, width, height} = v.getBounds()
      v.setBounds({x: x - columnWidth, y:y, width: width, height: height})
      win.removeBrowserView(v)
      newViews.push(v)
    }
    for (view of newViews) {
      win.addBrowserView(view)
    }

    const columns = store.get('columns')
    const newColumns = columns.filter((_v,i) => i !== indexOfColumn)
    store.set('columns', newColumns)
  }

  ipcMain.on('wheel-event', (_event, deltaX, _deltaY, _deltaZ) => {
    win.webContents.send('scroll', deltaX)
    console.log(`ipcMain`, deltaX)
    for (const view of win.getBrowserViews()) {
      const {x, y, width, height} = view.getBounds()
      view.setBounds({ x: x - deltaX, y: y, width: width, height: height })
    }
  })
}

function loadPages(window, columns) {
  window.webContents.send('onload', columns.length)
  const {height} = window.getBounds()
  for (let i = 0; i < columns.length; i++) {
    loadPage(window, { x: i * columnWidth + offset, y: marginTop, width: columnWidth, height: height-marginTop }, columns[i])
  }
}

function loadPage(window, bounds, column) {
  const {url, css, js} = column
  const view = createBrowserView(column)
  window.addBrowserView(view)
  view.setBounds(bounds)
  view.setBackgroundColor("#bfc4cf")
  view.webContents.loadURL(url)
  view.setAutoResize({ width: false, height: true })
  
  view.webContents.on('did-finish-load', () => {
    view.webContents.insertCSS("::-webkit-scrollbar {display: none !important;}" + css)
    if (js !== undefined && js !== '') {
      view.webContents.executeJavaScript(js, true)
    }
  })
}

function createBrowserView(column) {
  const {partition} = column

  const webPreferences = {
    preload: path.join(__dirname, 'preload-page.js'),
  }

  if (partition !== undefined && partition !== "") {
    webPreferences.partition =  `persist:${partition}`
  }

  return new BrowserView({ webPreferences: webPreferences })
}

function openAddColumn(window) {
  const modal = new BrowserWindow({
    parent: window,
    show: false,
    width: 500,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, 'preload-modal.js')
    }
  })
  modal.loadFile('modal.html')
  modal.once('ready-to-show', () => {
    modal.show()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})