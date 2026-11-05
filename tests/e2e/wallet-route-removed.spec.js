import { test, expect } from './fixtures'

test('không còn menu hoặc route ví khách hàng', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager-test', user: { id: 1, tenant_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => route.fulfill({ json: { data: [], total: 0 } }))
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Ví khách hàng' })).toHaveCount(0)
  await page.goto('/wallet')
  await expect(page.getByText('Ví khách hàng', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Thêm mới' })).toHaveCount(0)
})