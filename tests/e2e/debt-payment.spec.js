import { test, expect } from '@playwright/test'

test('tìm khách rồi chọn hóa đơn còn nợ để thu', async ({ page }) => {
  const writes = []
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên A', system_role: 'STAFF' } } } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Khách A', phone_number: '0901', total_debt: 300000 }], total: 1 } })
    if (path === '/api/invoices') return route.fulfill({ json: { data: [{ id: 12, customer_id: 1, invoice_date: '2026-10-09', created_at: '2026-10-10', branch_name: 'Cơ sở Một', debt_amount: 300000 }], total: 1 } })
    if (path === '/api/debt-payments/invoices/12/remaining-debt') return route.fulfill({ json: { data: { invoiceId: 12, customerId: 1, remainingDebtAmount: 300000 } } })
    if (path === '/api/debt-payments' && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { debtPaymentId: 5 } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/debts')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: /Khách A/ }).click()
  await expect(page.getByText(/Ngày tạo: 10\/10\/2026/)).toBeVisible()
  await expect(page.getByText(/Cơ sở lập: Cơ sở Một/)).toBeVisible()
  await page.getByRole('checkbox', { name: /Hóa đơn #12/ }).check()
  await page.getByRole('button', { name: 'Lưu giao dịch' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0]).toMatchObject({ invoice_id: 12, amount: 300000, payment_method: 'CASH' })
})