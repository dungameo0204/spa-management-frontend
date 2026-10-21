const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('@playwright/test')
const { pathToFileURL } = require('node:url')

const root = path.resolve(__dirname, '..')
const output = path.join(root, 'release', 'Xuly-Spa-Demo')
const name = 'XULY-SPA-HUONG-DAN-SU-DUNG-VA-KICH-BAN-DEMO'
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const inline = value => escape(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

async function main() {
  await fs.mkdir(output, { recursive: true })
  const markdown = await fs.readFile(path.join(root, 'docs', `${name}.md`), 'utf8')
  const lines = markdown.split(/\r?\n/)
  const html = []
  let table = false
  for (const line of lines) {
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(value => value.trim())
      if (cells.every(value => /^:?-+:?$/.test(value))) continue
      const tag = table ? 'td' : 'th'
      if (!table) { html.push('<table>'); table = true }
      html.push(`<tr>${cells.map(value => `<${tag}>${inline(value)}</${tag}>`).join('')}</tr>`)
      continue
    }
    if (table) { html.push('</table>'); table = false }
    const heading = line.match(/^(#{1,6}) (.*)$/)
    if (heading) html.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`)
    else if (/^- /.test(line)) html.push(`<p class="bullet">• ${inline(line.slice(2))}</p>`)
    else if (line.trim()) html.push(`<p>${inline(line)}</p>`)
  }
  if (table) html.push('</table>')
  const document = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Xuly Spa — Hướng dẫn và kịch bản demo</title><style>
    @page{size:A4;margin:18mm 16mm}*{box-sizing:border-box}body{font:14px/1.65 "Segoe UI",Arial,sans-serif;color:#203b32;background:#eef3ef;margin:0}main{max-width:980px;margin:30px auto;padding:44px;background:white}header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #cda86b;padding-bottom:20px}header img{width:85px}header strong{font-size:32px}header small{display:block}h1{color:#245a4a;font-size:30px}h2{color:#245a4a;border-bottom:1px solid #d7e4dd;padding-bottom:8px;margin-top:32px}h3{color:#326652;margin-top:24px}h1,h2,h3{break-after:avoid}p{margin:9px 0}p.bullet{padding-left:15px}code{font-size:.9em;background:#edf3ef;padding:1px 4px;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:12px;margin:16px 0}th,td{border:1px solid #cfddd4;text-align:left;padding:8px;vertical-align:top}th{background:#e7f0e9}tr{break-inside:avoid}footer{margin-top:30px;border-top:1px solid #cfddd4;padding-top:12px;font-size:12px}@media print{body{background:white}main{margin:0;padding:0;max-width:none}h2{font-size:20px}}
    </style><main><header><img src="Xuly-Spa-logo.svg" alt="Logo Xuly Spa"><div><strong>Xuly Spa</strong><small>QUẢN LÝ GỌN GÀNG · CHĂM SÓC CHỈN CHU</small></div></header>${html.join('\n')}<footer>Xuly Spa · Tài liệu hướng dẫn và sản xuất video · Phiên bản 0.1.0</footer></main></html>`
  await Promise.all([
    fs.writeFile(path.join(output, `${name}.html`), document, 'utf8'),
    fs.writeFile(path.join(output, `${name}.md`), markdown, 'utf8'),
    fs.copyFile(path.join(root, 'public', 'icons', 'icon.svg'), path.join(output, 'Xuly-Spa-logo.svg')),
    fs.copyFile(path.join(root, 'public', 'icons', 'icon-512.png'), path.join(output, 'Xuly-Spa-logo-512.png')),
  ])
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(path.join(output, `${name}.html`)).href)
    await page.pdf({ path: path.join(output, `${name}.pdf`), format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="font-size:9px;width:100%;text-align:center;color:#53705f">Xuly Spa · <span class="pageNumber"></span> / <span class="totalPages"></span></div>', margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' } })
    console.log(`Đã xuất Markdown, HTML, PDF và logo: ${output}`)
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })