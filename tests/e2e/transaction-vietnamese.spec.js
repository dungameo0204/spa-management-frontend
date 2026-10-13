import { test, expect } from '@playwright/test'

test('biểu mẫu nạp ví hiển thị Tiền thưởng với dấu tiếng Việt', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } })))
  await page.route('**/api/**', route => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue()
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/wallet')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await expect(page.getByText('Tiền thưởng', { exact: true })).toBeVisible()
  await expect(page.getByText('Ti?n th??ng', { exact: true })).toHaveCount(0)
})