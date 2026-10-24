const { _electron: electron } = require('@playwright/test')
const path = require('node:path')
const fs = require('node:fs/promises')

async function main() {
  const root = path.resolve(__dirname, '..')
  const output = path.join(root, 'release', 'Xuly-Spa-Demo')
  await fs.mkdir(output, { recursive: true })
  const app = await electron.launch({ executablePath: path.join(root, 'release', 'win-unpacked', "O'HINA.exe"), timeout: 60000 })
  try {
    const page = await app.firstWindow()
    await page.getByPlaceholder('Nhập tên đăng nhập').waitFor({ timeout: 30000 })
    await page.locator('.login-logo').waitFor()
    const identity = await app.evaluate(({ app, BrowserWindow }) => ({ name: app.getName(), version: app.getVersion(), packaged: app.isPackaged, maximized: BrowserWindow.getAllWindows()[0].isMaximized(), menuVisible: BrowserWindow.getAllWindows()[0].isMenuBarVisible() }))
    if (identity.name !== "O'HINA" || !identity.packaged || !identity.maximized || identity.menuVisible) throw Error(`Desktop identity mismatch: ${JSON.stringify(identity)}`)
    const logoLoaded = await page.locator('.login-logo img').evaluate(img => img.complete && img.naturalWidth > 0)
    if (!logoLoaded) throw Error('Logo failed to load')
    await page.screenshot({ path: path.join(output, 'Xuly-Spa-man-hinh-dang-nhap.png') })
    await fs.writeFile(path.join(output, 'kiem-tra-app.json'), JSON.stringify({ ...identity, logoLoaded, pageTitle: await page.title(), checkedAt: new Date().toISOString(), scope: 'Packaged desktop startup and login UI only; no live business writes' }, null, 2))
    console.log('PASS:', identity, 'Logo loaded. Login screenshot saved.')
  } finally { await app.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })