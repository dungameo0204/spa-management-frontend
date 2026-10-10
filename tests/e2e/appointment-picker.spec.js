import { test, expect } from '@playwright/test'

test('chọn khách trong lịch hẹn giữ tên hiển thị và gửi đúng mã khách', async ({ page }) => {
  let saved
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    if (url.pathname === '/api/customers') return route.fulfill({ json: { total: 1, page: 1, pageSize: 20, totalPages: 1, data: [{ id: 7, fullname: 'Khách Hoa', phone_number: '0900000000' }] } })
    if (url.pathname === '/api/appointments' && route.request().method() === 'POST') { saved = route.request().postDataJSON(); return route.fulfill({ json: { data: { id: 9 } } }) }
    return route.fulfill({ json: { total: 0, page: 1, pageSize: 20, totalPages: 0, data: [] } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/appointments')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).fill('Hoa')
  await page.getByRole('option', { name: /Khách Hoa/ }).click()
  await expect(page.getByRole('combobox', { name: 'Tìm khách hàng' })).toHaveValue('Khách Hoa')
  await page.getByLabel('Ngày hẹn').fill('2026-10-15')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => saved?.customer_id).toBe(7)
})