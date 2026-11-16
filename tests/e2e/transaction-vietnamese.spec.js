import { test, expect } from './fixtures'

test('biểu mẫu nạp ví hiển thị Tiền thưởng với dấu tiếng Việt', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } })))
  await page.route('**/api/**', route => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue()
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/wallet')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await expect(page.getByText('Tiền thưởng', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Ngày giao dịch')).toHaveCount(0)
  await expect(page.getByText('Ti?n th??ng', { exact: true })).toHaveCount(0)
})

test('quản lý gửi ngày giao dịch khi nạp ví', async ({ page }) => {
  const writes = []
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }], total: 1 } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 7, fullname: 'Khách nạp ví' }], total: 1 } })
    if (path === '/api/customer-wallet-logs' && route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON())
      return route.fulfill({ json: { walletLogId: 9 } })
    }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/wallet')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await expect(page.getByLabel('Ngày giao dịch')).toBeVisible()
  await page.getByLabel('Cơ sở nạp ví').selectOption('1')
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: 'Khách nạp ví' }).click()
  await page.getByLabel('Tiền khách nạp').fill('1000000')
  await page.getByLabel('Ngày giao dịch').fill('2026-11-10')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes).toEqual([expect.objectContaining({ customer_id: 7, branch_id: 1, paid_amount: 1000000, created_at: '2026-11-10' })])
})