import { test, expect } from '@playwright/test'

test('tải lại trang vẫn giữ phiên và tải dữ liệu mới', async ({ page }) => {
  let loads = 0
  let checks = 0
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/me') { checks++; expect(route.request().headers().authorization).toBe('Bearer test-token'); return route.fulfill({ json: { data: { user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên A', system_role: 'STAFF' } } } }) }
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên A', system_role: 'STAFF' } } } })
    if (path === '/api/products') { loads++; return route.fulfill({ json: { data: [{ id: 1, name: 'Serum', is_product: 1, price: 100000 }], total: 1 } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/products?view=all#items')
  await expect(page.getByText('Serum')).toBeVisible()
  const before = loads
  await page.reload()
  await expect(page).toHaveURL(/\/products\?view=all#items$/)
  await expect(page.getByRole('heading', { name: 'Sản phẩm & dịch vụ' })).toBeVisible()
  await expect.poll(() => loads).toBeGreaterThan(before)
  expect(checks).toBe(2)
})

test('lỗi xác minh tạm thời không mất phiên và không tải nghiệp vụ trước khi thử lại', async ({ page }) => {
  let attempts = 0, business = 0
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'saved', user: { system_role: 'STAFF' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/me') {
      attempts++
      return attempts === 1 ? route.fulfill({ status: 503, json: { code: 'AUTH_SERVICE_ERROR', message: 'Máy chủ tạm thời gián đoạn' } }) : route.fulfill({ json: { data: { user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    }
    business++
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/products?view=all#items')
  await expect(page.getByRole('alert')).toHaveText('Máy chủ tạm thời gián đoạn')
  expect(business).toBe(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('xuly.session')).token)).toBe('saved')
  await page.getByRole('button', { name: 'Thử lại' }).click()
  await expect(page.getByRole('heading', { name: 'Sản phẩm & dịch vụ' })).toBeVisible()
  await expect(page).toHaveURL(/\/products\?view=all#items$/)
})

test('token hết hạn đưa về login và xóa storage', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'expired' })))
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { code: 'AUTH_TOKEN_EXPIRED', message: 'Phiên đã hết hạn' } }))
  await page.goto('/products')
  await expect(page.getByPlaceholder('Nhập tên đăng nhập')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('xuly.session'))).toBeNull()
})