import { test, expect } from './fixtures'

test('staff collects legacy debt of a mixed-debt customer without sending an invoice or branch', async ({ page }) => {
  const writes = []
  let detailReads = 0
  await page.route('**/api/**', route => {
    const { pathname: path } = new URL(route.request().url())
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'legacy-test', user: { id: 1, branch_id: 2, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 123, fullname: 'Khách hỗn hợp', total_debt: 1500000 }], total: 1 } })
    if (path === '/api/customers/123') {
      detailReads++
      return route.fulfill({ json: { data: { id: 123, fullname: 'Khách hỗn hợp', total_debt: writes.length ? 1300000 : 1500000, invoice_debt: 1000000, legacy_debt: writes.length ? 300000 : 500000 } } })
    }
    if (path === '/api/debt-payments/legacy') {
      writes.push(route.request().postDataJSON())
      return route.fulfill({ status: 201, json: {} })
    }
    if (path === '/api/debt-payments') return route.fulfill({ json: { data: writes.length ? [{ id: 5, customer_name: 'Khách hỗn hợp', invoice_id: null, amount: 200000, collection_branch_name: 'Cơ sở Hai' }] : [], total: writes.length } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/debts')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: 'Khách hỗn hợp' }).click()
  await page.getByLabel('Loại thu nợ').selectOption('legacy')
  await expect(page.getByText(/Nợ cũ có thể thu: 500\.000/)).toBeVisible()
  await expect(page.getByLabel('Cơ sở thu', { exact: true })).toHaveCount(0)
  await page.getByLabel('Số tiền thu', { exact: true }).fill('200000')
  await page.getByLabel('Phương thức thanh toán', { exact: true }).selectOption('TRANSFER')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã ghi nhận khoản thu nợ cũ.')).toBeVisible()
  expect(writes).toEqual([{ customer_id: 123, amount: 200000, payment_method: 'TRANSFER' }])
  await expect(page.getByRole('row', { name: /Khách hỗn hợp.*Nợ cũ.*200\.000/ })).toBeVisible()
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: 'Khách hỗn hợp' }).click()
  await page.getByLabel('Loại thu nợ').selectOption('legacy')
  await expect(page.getByText(/Nợ cũ có thể thu: 300\.000/)).toBeVisible()
  expect(detailReads).toBeGreaterThan(1)
})