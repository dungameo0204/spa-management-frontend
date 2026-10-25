import { test, expect } from './fixtures'

test('tìm khách rồi chọn hóa đơn còn nợ để thu', async ({ page }) => {
  const writes = []
  let listReads = 0
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên A', system_role: 'STAFF' } } } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Khách A', phone_number: '0901', total_debt: 300000 }], total: 1 } })
    if (path === '/api/invoices') return route.fulfill({ json: { data: [{ id: 12, customer_id: 1, invoice_date: '2026-10-09', created_at: '2026-10-10', branch_name: 'Cơ sở Một', debt_amount: 300000 }], total: 1 } })
    if (path === '/api/debt-payments/invoices/12/remaining-debt') return route.fulfill({ json: { data: { invoiceId: 12, customerId: 1, remainingDebtAmount: 300000 } } })
    if (path === '/api/debt-payments' && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { debtPaymentId: 5 } }) }
    if (path === '/api/debt-payments' && route.request().method() === 'GET') { listReads++; return route.fulfill({ json: { data: writes.length ? [{ id: 5, customer_name: 'Khách A', invoice_id: 12, amount: 300000, payment_date: '2026-10-10', branch_name: 'Cơ sở Một' }] : [], total: writes.length } }) }
    if (path === '/api/debt-payments/5') return route.fulfill({ json: { data: { id: 5, invoice_id: 12, customer_name: 'Khách A', branch_name: 'Cơ sở Một', amount: 300000, payment_method: 'CASH', payment_date: '2026-10-10' } } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/debts')
  await expect.poll(() => listReads).toBeGreaterThan(0)
  const readsBeforeSave = listReads
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: /Khách A/ }).click()
  await expect(page.getByText(/Ngày tạo: 10\/10\/2026/)).toBeVisible()
  await expect(page.getByText(/Cơ sở lập: Cơ sở Một/)).toBeVisible()
  await page.getByRole('checkbox', { name: /Hóa đơn #12/ }).click()
  await page.getByRole('checkbox', { name: 'In phiếu sau khi lưu' }).check()
  await expect(page.getByRole('combobox', { name: 'Khổ giấy in' })).toHaveValue('A4')
  await page.getByRole('combobox', { name: 'Khổ giấy in' }).selectOption('K57')
  await page.evaluate(() => { window.print = () => { const receipt = document.querySelector('#receipt-print'); document.body.dataset.printed = receipt?.textContent || ''; document.body.dataset.paper = receipt?.className || ''; document.body.dataset.pageRule = receipt?.querySelector('style')?.textContent || ''; window.dispatchEvent(new Event('afterprint')) } })
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0]).toMatchObject({ invoice_id: 12, amount: 300000, payment_method: 'CASH' })
  await expect.poll(() => listReads).toBeGreaterThan(readsBeforeSave)
  await expect(page.getByRole('row', { name: /Khách A.*12.*300\.000/ })).toBeVisible()
  await expect.poll(() => page.locator('body').getAttribute('data-printed')).toContain('300.000')
  await expect(page.locator('body')).toHaveAttribute('data-paper', /receipt-size-K57/)
  await expect(page.locator('body')).toHaveAttribute('data-page-rule', /57mm 200mm/)
  await page.getByRole('row', { name: /Khách A.*12.*300\.000/ }).click()
  for (const [size, rule] of [['K80', '80mm 200mm'], ['A5', 'A5'], ['A4', 'A4']]) {
    await page.getByRole('combobox', { name: 'Khổ giấy in' }).selectOption(size)
    await page.getByRole('button', { name: 'In phiếu' }).click()
    await expect(page.locator('body')).toHaveAttribute('data-paper', new RegExp(`receipt-size-${size}`))
    await expect(page.locator('body')).toHaveAttribute('data-page-rule', new RegExp(`size: ${rule}`))
  }
})