import { test, expect } from '@playwright/test'

test('nhãn in hóa đơn giữ nguyên dấu tiếng Việt trên giao diện', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } })))
  await page.route('**/api/**', route => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue()
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/invoices')
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  await expect(page.getByText('In hóa đơn sau khi lưu')).toBeVisible()
  await expect(page.getByText('In hóa đơn sau khi lưu')).not.toContainText('?')
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
})