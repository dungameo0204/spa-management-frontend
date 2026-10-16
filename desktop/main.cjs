const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { startServer } = require('./server.cjs')

let server
app.whenReady().then(async () => {
  try {
    const result = await startServer({ distDir: path.join(__dirname, '..', 'dist') })
    server = result.server
    const window = new BrowserWindow({
      icon: path.join(__dirname, '..', 'dist', 'icons', 'icon.ico'),
      width: 1280, height: 850, minWidth: 800, minHeight: 600,
      title: 'Xuly Spa · Phần mềm quản lý Spa', autoHideMenuBar: true,
      show: false, backgroundColor: '#f7f5f1',
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    })
    window.removeMenu()
    window.once('ready-to-show', () => { window.maximize(); window.show() })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', (event, url) => {
      if (new URL(url).origin !== result.origin) event.preventDefault()
    })
    await window.loadURL(result.origin)
  } catch (error) {
    console.error('Không thể mở ứng dụng:', error)
    app.quit()
  }
})

app.on('window-all-closed', () => app.quit())
app.on('before-quit', () => server?.close())