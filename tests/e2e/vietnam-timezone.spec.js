import { test, expect } from './fixtures'

for (const timezoneId of ['UTC', 'America/Los_Angeles', 'Asia/Ho_Chi_Minh']) {
  test.describe(`ngày Việt Nam khi trình duyệt ở ${timezoneId}`, () => {
    test.use({ timezoneId })

    test('lọc đúng buổi và cho hoàn tác cùng ngày Việt Nam', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-10-27T17:00:00Z'))
      await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'timezone-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } })))
      const writes = []
      const histories = [
        { id: 77, branch_id: 1, execution_date: '2026-10-27T17:00:00Z', created_at: '2026-10-27T17:00:00Z', staffs: [] },
        { id: 78, branch_id: 1, execution_date: '2026-10-28', created_at: '2026-10-27T17:00:00Z', staffs: [] },
        { id: 79, branch_id: 1, execution_date: '2026-10-27T16:59:59Z', created_at: '2026-10-27T16:59:59Z', staffs: [] },
      ]
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        if (!path.startsWith('/api/')) return route.continue()
        if (path === '/api/treatments/execute/77' && route.request().method() === 'DELETE') {
          writes.push(77)
          return route.fulfill({ json: {} })
        }
        if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách múi giờ', product_name: 'Chăm sóc da', created_at: '2026-10-01', remaining_sessions: 3 }], total: 1 } })
        if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories } } })
        return route.fulfill({ json: { data: [], total: 0 } })
      })
      await page.goto('/')
      await expect(page.locator('tr[data-history-id="77"]')).toBeVisible()
      await expect(page.locator('tr[data-history-id="78"]')).toBeVisible()
      await expect(page.locator('tr[data-history-id="79"]')).toHaveCount(0)
      const checkbox = page.locator('tr[data-history-id="77"]').getByRole('checkbox')
      await expect(checkbox).toBeChecked()
      await expect(checkbox).toBeEnabled()
      await checkbox.click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
      await expect.poll(() => writes).toEqual([77])
    })

    test('thẻ mới từ timestamp UTC hiển thị và gửi ngày Việt Nam không đổi', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-10-27T17:00:00Z'))
      await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'timezone-manager', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
      const writes = []
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        if (!path.startsWith('/api/')) return route.continue()
        if (path === '/api/treatments/execute' && route.request().method() === 'POST') {
          writes.push(route.request().postDataJSON())
          return route.fulfill({ json: { treatmentHistoryId: 80 } })
        }
        if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách mới', product_name: 'Chăm sóc da', created_at: '2026-10-27T17:00:00Z', remaining_sessions: 3 }], total: 1 } })
        if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: [] } } })
        if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }], total: 1 } })
        return route.fulfill({ json: { data: [], total: 0 } })
      })
      await page.goto('/')
      await page.getByRole('checkbox', { name: /Đã làm Khách mới/ }).check()
      await expect(page.getByLabel('Ngày thực hiện')).toHaveValue('2026-10-28')
      await page.getByRole('combobox', { name: 'Cơ sở thực hiện', exact: true }).selectOption('1')
      await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
      await expect.poll(() => writes).toEqual([{ treatment_id: 10, branch_id: 1, execution_date: '2026-10-28', staffs: [] }])
    })
  })
}