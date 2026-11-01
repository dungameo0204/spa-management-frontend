import { test, expect } from './fixtures'

test('tablet dùng menu trượt, desktop giữ sidebar cố định', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/me') return route.fulfill({ json: { data: { user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
    return route.fulfill({ json: { data: [], total: 0, totalPages: 0 } })
  })
  await page.goto('/customer-bookings')
  await expect(page.getByRole('heading', { name: 'Khách đặt lịch', exact: true })).toBeVisible()

  for (const width of [744, 768, 834, 912, 1032, 1100]) {
    await page.setViewportSize({ width, height: 1024 })
    await expect(page.getByRole('button', { name: 'Mở menu' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Điều hướng nhanh' })).toBeVisible()
    await expect.poll(async () => {
      const box = await page.locator('.sidebar').boundingBox()
      return box.x + box.width <= 0
    }).toBe(true)
    await page.getByRole('button', { name: 'Mở menu' }).click()
    await expect.poll(async () => (await page.locator('.sidebar').boundingBox()).x).toBe(0)
    await page.getByRole('button', { name: 'Đóng menu' }).first().click()
    await expect.poll(async () => {
      const box = await page.locator('.sidebar').boundingBox()
      return box.x + box.width <= 0
    }).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }

  for (const width of [1101, 1440]) {
    await page.setViewportSize({ width, height: 1024 })
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mở menu' })).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Điều hướng nhanh' })).toBeHidden()
  }
})