import { test, expect } from './fixtures'
import { expectDesktopInvoiceLine } from './invoice-line-layout'

async function setup(page, { rejectDelete = false, rejectUpdate = false, standalone = false } = {}) {
  const puts = [], deletes = []
  let reads = 0
  const invoice = { id: 88, customer_id: 10, customer_name: 'Khách A', total_amount: 40000000, paid_amount: 40000000, wallet_used: 0, items: [{ id: 123, product_id: 20, snapshot_name: 'Trị nám', snapshot_price: 40000000, quantity: 1, treatment: { id: 200, total_sessions: null, children: [{ id: 201, product_id: 12, product_name: 'Laser đã mua', total_sessions: 5 }, { id: 202, product_id: 15, product_name: 'Điện di đã mua', total_sessions: null }] } }] }
  if (standalone) invoice.items[0].treatment = { id: 200, total_sessions: 5, children: [] }
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname, method = route.request().method()
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/invoices/88' && method === 'GET') { reads++; return route.fulfill({ json: { data: invoice } }) }
    if (path === '/api/invoices/88' && method === 'PUT') {
      const body = route.request().postDataJSON(); puts.push(body)
      if (rejectUpdate) return route.fulfill({ status: 400, json: { message: 'Tổng mới không được thấp hơn số buổi đã dùng.' } })
      invoice.items[0] = { ...invoice.items[0], id: 456, treatment: { ...invoice.items[0].treatment, ...body.items[0].treatment } }
      return route.fulfill({ json: { message: 'Đã lưu' } })
    }
    if (path === '/api/invoices/88' && method === 'DELETE') { deletes.push(88); return route.fulfill(rejectDelete ? { status: 400, json: { message: 'Không thể xóa thẻ đã sử dụng hoặc đã ký.' } } : { json: { message: 'Đã xóa' } }) }
    if (path === '/api/invoices') return route.fulfill({ json: { data: [invoice], total: 1 } })
    if (path === '/api/customers/10') return route.fulfill({ json: { data: { id: 10, fullname: 'Khách A', wallet_balance: 0 } } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/invoices')
  await page.getByRole('row', { name: /Khách A/ }).click()
  return { puts, deletes, reads: () => reads }
}

test('PUT preserves item identity and actual child configuration; GET refreshes IDs for next amendment', async ({ page }) => {
  const state = await setup(page)
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Số buổi Laser đã mua' }).fill('3')
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toBeVisible()
  expect(state.puts[0].items[0]).toMatchObject({ invoice_item_id: 123, treatment: { total_sessions: null, children: [{ product_id: 12, total_sessions: 3 }, { product_id: 15, total_sessions: null }] } })
  expect(state.reads()).toBeGreaterThanOrEqual(3)
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect.poll(() => state.puts.length).toBe(2)
  expect(state.puts[1].items[0].invoice_item_id).toBe(456)
})

for (const width of [1024, 1280, 1440, 1920]) test(`standalone amendment has inline lifetime and saves finite/lifetime configuration at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  const state = await setup(page, { standalone: true })
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  const line = page.locator('.compact-invoice-line')
  const count = line.getByRole('spinbutton', { name: 'Số buổi liệu trình' })
  const lifetime = line.getByRole('checkbox', { name: 'Trọn đời', exact: true })
  await expect(count).toHaveValue('5')
  await expectDesktopInvoiceLine(line)
  const a = await lifetime.boundingBox(), b = await count.boundingBox()
  expect(a.x).toBeGreaterThan(b.x)
  expect(a.y).toBeLessThan(b.y + b.height)
  const pickerBox = await line.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).boundingBox()
  const consultantBox = await line.getByRole('button', { name: 'Tư vấn', exact: true }).boundingBox()
  expect(pickerBox.width).toBeLessThanOrEqual(365)
  expect(consultantBox.y).toBeLessThan(b.y + b.height)
  await page.screenshot({ path: 'test-results/invoice-edit-standalone-aligned.png' })
  await lifetime.check()
  await expectDesktopInvoiceLine(line)
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toBeVisible()
  expect(state.puts[0].items[0].treatment).toEqual({ total_sessions: null, children: [] })
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  await lifetime.uncheck()
  await count.fill('8')
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect.poll(() => state.puts.length).toBe(2)
  expect(state.puts[1].items[0].treatment).toEqual({ total_sessions: 8, children: [] })
})

test('rejected amendment keeps draft', async ({ page }) => {
  await setup(page, { rejectUpdate: true })
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Số buổi Laser đã mua' }).fill('1')
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect(page.getByRole('alert')).toContainText('thấp hơn số buổi đã dùng')
  await expect(page.getByRole('spinbutton', { name: 'Số buổi Laser đã mua' })).toHaveValue('1')
})

for (const rejectDelete of [false, true]) test(`delete group delegates usage/signature checks to backend: reject=${rejectDelete}`, async ({ page }) => {
  const state = await setup(page, { rejectDelete })
  await page.getByRole('button', { name: 'Xóa hóa đơn', exact: true }).click()
  await page.getByRole('alertdialog', { name: 'Xóa hóa đơn?' }).getByRole('button', { name: /Xác nhận/ }).click()
  await expect.poll(() => state.deletes.length).toBe(1)
  if (rejectDelete) await expect(page.getByRole('alert')).toContainText('đã sử dụng hoặc đã ký')
  else await expect(page.locator('.invoice-drawer')).toHaveCount(0)
})