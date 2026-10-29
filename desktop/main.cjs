const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { startServer } = require('./server.cjs')
const { startUpdates } = require('./updates.cjs')

// Preserve the installed application's profile path across the display-name change.
app.setPath('userData', path.join(app.getPath('appData'), "O'HINA"))
app.setName("KAS")
app.setAppUserModelId('vn.xuly.spa.desktop')
let server
app.whenReady().then(async () => {
  try {
    const result = await startServer({ distDir: path.join(__dirname, '..', 'dist') })
    server = result.server
    const window = new BrowserWindow({
      icon: path.join(__dirname, '..', 'dist', 'icons', 'icon.ico'),
      width: 1280, height: 850, minWidth: 800, minHeight: 600,
      title: "KAS · Phần mềm quản lý Spa", autoHideMenuBar: true,
      show: false, backgroundColor: '#faf8f3',
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    })
    window.removeMenu()
    window.once('ready-to-show', () => { window.maximize(); window.show() })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', (event, url) => {
      if (new URL(url).origin !== result.origin) event.preventDefault()
    })
    await window.loadURL(result.origin)
    startUpdates(app, window)
  } catch (error) {
    console.error('Không thể mở ứng dụng:', error)
    app.quit()
  }
})

app.on('window-all-closed', () => app.quit())
app.on('before-quit', () => server?.close())