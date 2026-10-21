const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const projectDir = path.join(__dirname, '..')
const output = path.join(projectDir, 'release')
const builder = path.join(projectDir, 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js')
const target = process.argv.includes('--installer') ? 'nsis' : 'portable'
const args = ['--win', target, '--x64', '--publish', 'never']
const icons = spawnSync(process.execPath, [path.join(__dirname, 'icons.cjs')], { cwd: projectDir, stdio: 'inherit' })
if (icons.status !== 0) process.exit(icons.status ?? 1)
// Desktop must use its local /api proxy, even when a web deployment .env is present.
const frontend = spawnSync(process.execPath, [path.join(projectDir, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], {
  cwd: projectDir, stdio: 'inherit', env: { ...process.env, VITE_API_BASE_URL: '' },
})
if (frontend.status !== 0) process.exit(frontend.status ?? 1)
function run(extra = []) {
  return spawnSync(process.execPath, [builder, ...args, ...extra], { cwd: projectDir, stdio: 'inherit' })
}

let result = run()
// Some Windows antivirus/indexers keep a just-extracted Electron directory open,
// blocking electron-builder's atomic .tmp rename. Its complete unpacked directory
// can be used as an electronDist input on retry.
const extracted = path.join(output, 'win-unpacked.tmp')
if (result.status !== 0 && fs.existsSync(path.join(extracted, 'electron.exe'))) {
  console.warn('Thử lại bằng bộ Electron đã giải nén (Windows giữ khóa thư mục tạm).')
  result = run([`--config.electronDist=${extracted}`])
}
if (result.error) console.error(result.error)
process.exit(result.status ?? 1)