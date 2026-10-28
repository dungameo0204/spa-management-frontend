import { test, expect } from './fixtures'
import { today } from '../../src/utils/format'

for (const width of [1440, 390]) {
  test(`hai buổi cùng thẻ có dòng và thao tác riêng ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const writes = [], day = today()
    let histories = [
      { id: 77, branch_id: 1, execution_date: day, created_at: `${day} 09:00:00`, staffs: [{ staff_id: 2, staff_name: 'Nhân viên Một' }] },
      { id: 78, branch_id: 1, execution_date: day, created_at: `${day} 10:00:00`, staffs: [{ staff_id: 3, staff_name: 'Nhân viên Hai' }] },
    ]
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname, method = route.request().method()
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-session', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } } } })
      if (method === 'PUT' || method === 'DELETE') {
        writes.push({ path, method })
        if (method === 'DELETE') histories = histories.filter(item => item.id !== 78)
        return route.fulfill({ json: {} })
      }
      if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Da', created_at: '2020-01-01', remaining_sessions: 2 }], total: 1 } })
      if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories } } })
      if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên Một', branch_id: 1 }, { id: 3, fullname: 'Nhân viên Hai', branch_id: 1 }], total: 2 } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/login')
    await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
    await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    const first = page.locator('tr[data-history-id="77"]'), second = page.locator('tr[data-history-id="78"]')
    await expect(first).toContainText('Nhân viên Một')
    await expect(first).not.toContainText('Nhân viên Hai')
    await expect(second).toContainText('Nhân viên Hai')
    await second.getByRole('button', { name: /Sửa nhân viên/ }).click()
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
    await expect.poll(() => writes.length).toBe(1)
    await second.getByRole('checkbox').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click()
    await expect(second).toHaveCount(0)
    await expect(first).toBeVisible()
    expect(writes).toEqual([{ path: '/api/treatments/execute/78/staffs', method: 'PUT' }, { path: '/api/treatments/execute/78', method: 'DELETE' }])
  })
}