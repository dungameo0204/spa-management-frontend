const { dialog } = require('electron')

function startUpdates(app, window) {
  // Portable binaries and development runs do not contain the NSIS update feed.
  if (!app.isPackaged || process.platform !== 'win32' || process.env.PORTABLE_EXECUTABLE_FILE) return
  const { autoUpdater } = require('electron-updater')
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.on('error', error => console.error('Không thể kiểm tra cập nhật:', error))
  autoUpdater.on('update-downloaded', async info => {
    if (window.isDestroyed()) return
    const { response } = await dialog.showMessageBox(window, {
      type: 'info', title: "Cập nhật O'HINA",
      message: `Đã tải O'HINA v${info.version}`,
      detail: 'Lưu công việc trước khi khởi động lại để cài bản mới. Dữ liệu nghiệp vụ được lưu trên máy chủ.',
      buttons: ['Khởi động lại và cập nhật', 'Để sau'], defaultId: 1, cancelId: 1,
    })
    if (response === 0) autoUpdater.quitAndInstall(false, true)
  })
  // Packaged portable builds are not supported; only installer builds include an update configuration.
  if (!require('node:fs').existsSync(require('node:path').join(process.resourcesPath, 'app-update.yml'))) return
  setTimeout(() => autoUpdater.checkForUpdates().catch(error => console.error('Lỗi kiểm tra cập nhật:', error)), 10000)
}

module.exports = { startUpdates }