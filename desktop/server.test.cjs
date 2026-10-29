const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const { backendUrl, startServer } = require('./server.cjs')

test('từ chối URL backend không hợp lệ', () => {
  assert.throws(() => backendUrl('file:///tmp/test'))
  assert.throws(() => backendUrl('http://user:pass@localhost:5000'))
  assert.throws(() => backendUrl('http://localhost:5000/api'))
})

test('mặc định kết nối backend HTTPS O’HINA, không cần backend local', () => {
  assert.equal(backendUrl().origin, 'https://api-spa-ohina.infinityhavocx.men')
  assert.equal(backendUrl('').origin, 'https://api-spa-ohina.infinityhavocx.men')
  assert.equal(backendUrl('http://127.0.0.1:5000').origin, 'http://127.0.0.1:5000')
})

test('phục vụ SPA và chuyển tiếp API sang backend với Authorization', async t => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xuly-desktop-'))
  t.after(() => fs.rmSync(distDir, { recursive: true, force: true }))
  fs.writeFileSync(path.join(distDir, 'index.html'), '<h1>Xuly</h1>')
  fs.writeFileSync(path.join(distDir, 'app.js'), 'console.log("ok")')
  const backend = http.createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/api/auth/login') {
      res.writeHead(401)
      res.end(JSON.stringify({ method: req.method, body: JSON.parse(body), contentType: req.headers['content-type'] }))
      return
    }
    res.end(JSON.stringify({ path: req.url, auth: req.headers.authorization, method: req.method }))
  })
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve))
  t.after(() => backend.close())
  const { server, origin } = await startServer({ distDir, apiBaseUrl: `http://127.0.0.1:${backend.address().port}` })
  t.after(() => server.close())
  const route = await fetch(`${origin}/invoices`, { headers: { Accept: 'text/html' } })
  assert.equal(route.status, 200)
  assert.equal(await route.text(), '<h1>Xuly</h1>')
  assert.equal((await fetch(`${origin}/missing.js`)).status, 404)
  const api = await fetch(`${origin}/api/staffs?page=2`, { headers: { Authorization: 'Bearer test-token' } })
  assert.deepEqual(await api.json(), { path: '/api/staffs?page=2', auth: 'Bearer test-token', method: 'GET' })
  const credentials = { username: 'test-user', password: 'test-only' }
  const login = await fetch(`${origin}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials),
  })
  assert.equal(login.status, 401)
  assert.deepEqual(await login.json(), { method: 'POST', body: credentials, contentType: 'application/json' })
  const denied = await new Promise((resolve, reject) => {
    http.get(`${origin}/api/staffs`, { headers: { Host: 'attacker.example' } }, response => {
      response.resume()
      resolve(response.statusCode)
    }).on('error', reject)
  })
  assert.equal(denied, 403)
})