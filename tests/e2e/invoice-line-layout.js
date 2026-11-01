import { expect } from '@playwright/test'

export async function expectDesktopInvoiceLine(line) {
  const controls = line.locator('.invoice-line-controls')
  const fields = controls.locator('.product-entry-row input:not(.picker-required), .invoice-line-execution-actions button, .invoice-line-top-actions button')
  const boxes = await fields.evaluateAll(elements => elements.filter(el => el.getClientRects().length).map(el => {
    const r = el.getBoundingClientRect()
    return { name: el.getAttribute('aria-label') || el.textContent || el.type, x: r.x, y: r.y, right: r.right, bottom: r.bottom }
  }))
  expect(boxes.length).toBeGreaterThanOrEqual(8)
  // Responsive rows may wrap, but controls must never overlap or leave the line.
  const bounds = await line.boundingBox()
  for (const [index, box] of boxes.entries()) {
    expect(box.x, JSON.stringify(box)).toBeGreaterThanOrEqual(bounds.x - 1)
    expect(box.right, JSON.stringify(box)).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
    for (const other of boxes.slice(index + 1)) {
      const overlaps = box.x < other.right - 1 && box.right > other.x + 1 && box.y < other.bottom - 1 && box.bottom > other.y + 1
      expect(overlaps, JSON.stringify([box, other])).toBe(false)
    }
  }
  const picker = await line.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).boundingBox()
  expect(picker.width).toBeGreaterThanOrEqual(80)
  const count = await line.locator('.quantity-field input').boundingBox()
  expect(count.width).toBeGreaterThanOrEqual(38)
  expect(count.x - (picker.x + picker.width)).toBeLessThanOrEqual(8)
  const scroll = line.locator('.invoice-line-scroll')
  const geometry = await scroll.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth, overflow: getComputedStyle(el).overflowX }))
  expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1)
  // Neither the line nor its ancestors should need horizontal scrolling.
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
  expect(remove.x + remove.width).toBeLessThanOrEqual(viewport.x + viewport.width + 1)
  expect(consultant.height).toBeLessThanOrEqual(38)
  expect(remove.width).toBeLessThanOrEqual(38)
}