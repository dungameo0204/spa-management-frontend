const http = require('node:http')
const https = require('node:https')
const fs = require('node:fs')
const path = require('node:path')

const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
}

function backendUrl(value) {
  const url = new URL(value || 'http://127.0.0.1:5002')
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('XULY_API_BASE_URL phải là địa chỉ HTTP(S) của backend, không có đường dẫn hoặc thông tin đăng nhập.')
  }
  return url
}

function startServer({ distDir, apiBaseUrl = process.env.XULY_API_BASE_URL || 'http://127.0.0.1:5002' } = {}) {
  const backend = backendUrl(apiBaseUrl)
  const root = path.resolve(distDir)
  const server = http.createServer((req, res) => {
    const host = req.headers.host || ''
    if (host !== `127.0.0.1:${server.address().port}`) { res.writeHead(403).end(); return }
    const pathname = new URL(req.url, `http://${host}`).pathname
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const target = new URL(req.url, backend)
      const transport = target.protocol === 'https:' ? https : http
      const headers = { ...req.headers, host: target.host }
      delete headers.connection
      delete headers['proxy-connection']
      delete headers['transfer-encoding']
      // The Electron UI uses the loopback origin; the backend should not need a browser Origin check for this proxy.
      delete headers.origin
      const upstream = transport.request(target, { method: req.method, headers }, response => {
        const responseHeaders = { ...response.headers }
        delete responseHeaders.connection
        delete responseHeaders['transfer-encoding']
        res.writeHead(response.statusCode, responseHeaders)
        response.pipe(res)
      })
      upstream.on('error', () => { if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ message: 'Không kết nối được backend. Kiểm tra XULY_API_BASE_URL và trạng thái máy chủ.' })) })
      req.pipe(upstream)
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
    let decoded
    try { decoded = decodeURIComponent(pathname) } catch { res.writeHead(400).end(); return }
    const file = path.resolve(root, `.${decoded}`)
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return }
    let asset = file
    try {
      if (!fs.statSync(asset).isFile()) throw new Error('Not a file')
    } catch {
      if (!req.headers.accept?.includes('text/html')) { res.writeHead(404).end(); return }
      asset = path.join(root, 'index.html')
    }
    res.writeHead(200, { 'Content-Type': contentTypes[path.extname(asset)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'" })
    if (req.method === 'HEAD') { res.end(); return }
    fs.createReadStream(asset).pipe(res)
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })
    })
  })
}

module.exports = { startServer, backendUrl }