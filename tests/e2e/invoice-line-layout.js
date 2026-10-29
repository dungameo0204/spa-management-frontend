import { expect } from '@playwright/test'

export async function expectDesktopInvoiceLine(line) {
  const controls = line.locator('.invoice-line-controls')
  const fields = controls.locator('.product-entry-row input:not(.picker-required), .invoice-item-actions input, .invoice-item-actions select, .invoice-item-actions button')
  const boxes = await fields.evaluateAll(elements => elements.filter(el => el.getClientRects().length).map(el => {
    const r = el.getBoundingClientRect()
    return { name: el.getAttribute('aria-label') || el.textContent || el.type, x: r.x, y: r.y, right: r.right, bottom: r.bottom }
  }))
  expect(boxes.length).toBeGreaterThanOrEqual(8)
  // Every actual control (not its label) shares a horizontal band.
  expect(Math.max(...boxes.map(b => b.y)), JSON.stringify(boxes)).toBeLessThan(Math.min(...boxes.map(b => b.bottom)))
  const sorted = [...boxes].sort((a, b) => a.x - b.x)
  for (let i = 1; i < sorted.length; i++) expect(sorted[i].x, JSON.stringify(sorted)).toBeGreaterThanOrEqual(sorted[i - 1].right - 1)
  const picker = await line.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).boundingBox()
  expect(picker.width).toBeGreaterThanOrEqual(80)
  expect(picker.width).toBeLessThanOrEqual(200)
  const count = await line.locator('.quantity-field input').boundingBox()
  expect(count.width).toBeGreaterThanOrEqual(38)
  expect(count.x - (picker.x + picker.width)).toBeLessThanOrEqual(8)
  const total = await line.locator('.line-total').boundingBox()
  const execution = line.locator('.execution-controls')
  if (await execution.count()) expect((await execution.boundingBox()).x - (total.x + total.width)).toBeLessThanOrEqual(8)
  const scroll = line.locator('.invoice-line-scroll')
  const geometry = await scroll.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth, overflow: getComputedStyle(el).overflowX }))
  expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1)
  // Overflow belongs to this complete strip, never to the drawer/page.
  expect(await line.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
  expect(await line.evaluate(el => {
    const drawer = el.closest('.drawer')
    return drawer.scrollWidth <= drawer.clientWidth + 1 && el.getBoundingClientRect().right <= window.innerWidth + 1
  })).toBe(true)
  const consultant = await line.getByRole('button', { name: 'Tư vấn', exact: true }).boundingBox()
  const viewport = await scroll.boundingBox()
  expect(consultant.x).toBeGreaterThanOrEqual(viewport.x - 1)
  expect(consultant.x + consultant.width).toBeLessThanOrEqual(viewport.x + viewport.width + 1)
  const remove = await line.getByRole('button', { name:'Bỏ dòng', exact:true }).boundingBox()
  expect(remove.x).toBeGreaterThanOrEqual(consultant.x + consultant.width)
  expect(remove.x + remove.width).toBeGreaterThanOrEqual(viewport.x + viewport.width - 2)
}