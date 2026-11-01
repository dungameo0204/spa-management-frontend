import { test, expect } from './fixtures'

test('manager edits the Vietnam invoice day without shifting it through UTC', async ({ page }) => {
  let saved
  let invoice = { id: 91, customer_id: 1, customer_name: 'Khách ngày bán', branch_id: 1, invoice_date: '2026-10-30T17:00:00.000Z', total_amount: 100000, paid_amount: 100000, wallet_used: 0, debt_amount: 0, items: [{ id: 10, product_id: 3, snapshot_name: 'Serum', snapshot_price: 100000, quantity: 1, final_price: 100000, is_product: 1, consultants: [] }] }
  await page.addInitScript(() => {
    sessionStorage.setItem('xuly.branch', '1')
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, system_role: 'MANAGER' } }))
  })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/invoices/91' && route.request().method() === 'PUT') {
      saved = route.request().postDataJSON()
      invoice = { ...invoice, invoice_date: saved.invoice_date }
      return route.fulfill({ json: { message: 'Đã lưu' } })
    }
    const data = path === '/api/invoices/91' ? invoice : path === '/api/invoices' ? [invoice]
      : path === '/api/customers/1' ? { id: 1, fullname: invoice.customer_name, wallet_balance: 0, total_debt: 0 }
        : path === '/api/branches' ? [{ id: 1, name: 'Cơ sở chính' }] : []
    return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1 } })
  })
  await page.goto('/invoices')
  await page.getByRole('row', { name: /Khách ngày bán/ }).click()
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  const date = page.getByLabel('Ngày hóa đơn', { exact: true })
  await expect(date).toHaveValue('2026-10-31')
  await date.fill('2026-10-29')
  await page.getByRole('button', { name: 'Lưu hóa đơn', exact: true }).click()
  await expect.poll(() => saved?.invoice_date).toBe('2026-10-29 00:00:00')
})