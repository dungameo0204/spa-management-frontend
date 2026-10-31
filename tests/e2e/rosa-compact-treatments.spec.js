import { test, expect } from './fixtures'

for (const width of [1440, 390]) {
  for (const customerPage of [false, true]) {
    test(`Rosa: chọn con, thực hiện và lịch sử ở cha, ${customerPage ? 'khách hàng' : 'liệu trình'} ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF', fullname: 'Lan' } })))
      const customer = { id: 1, fullname: 'Khách Rosa', phone_number: '0900000001', total_debt: 0 }
      const history = { execution_date: '2026-10-30', branch_id: 1, branch_name: 'CS1', staffs: [{ staff_name: 'Lan' }], customer_signature_svg: '<svg><path d="M1 1L20 20"/></svg>' }
      const root = { id: 10, customer_id: 1, customer_name: customer.fullname, product_name: 'Gói chữa nám', total_sessions: 10, remaining_sessions: 10, children: [
        { id: 11, product_name: 'pnp', total_sessions: null, remaining_sessions: null, histories: [{ ...history, id: 91 }] },
        { id: 12, product_name: 'laser', total_sessions: 5, remaining_sessions: 2, histories: [{ ...history, id: 92 }] },
        { id: 13, product_name: 'massage', total_sessions: 5, remaining_sessions: 0, histories: [] },
      ] }
      const finished = { id: 20, customer_id: 1, customer_name: customer.fullname, product_name: 'Đã hết buổi', total_sessions: 5, remaining_sessions: 0 }
      const executed = []
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        if (!path.startsWith('/api/')) return route.continue()
        if (path === '/api/treatments/execute') { executed.push(route.request().postDataJSON()); return route.fulfill({ json: { treatmentHistoryId: 99 } }) }
        if (path === '/api/customers/1/overview') return route.fulfill({ json: { data: { customer, timeline: [{ type: 'treatment', date: '2026-10-30', treatment: root }] } } })
        if (path === '/api/customers') return route.fulfill({ json: { data: [customer], total: 1 } })
        if (path === '/api/customers/1') return route.fulfill({ json: { data: customer } })
        if (path === '/api/treatments') return route.fulfill({ json: { data: [root, finished], totalPages: 1 } })
        if (path === '/api/treatments/10') return route.fulfill({ json: { data: root } })
        if (path === '/api/treatments/20') return route.fulfill({ json: { data: finished } })
        if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'KTV' }] } })
        if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 7, fullname: 'Lan', role_id: 1, branch_id: 1 }] } })
        return route.fulfill({ json: { data: [], total: 0 } })
      })
      await page.goto(customerPage ? '/customers' : '/treatments')
      if (customerPage) await page.getByText('Khách Rosa').first().click()
      else {
        await expect(page.getByRole('button', { name: 'Khách Rosa: 1 đã hoàn thành' })).toBeVisible()
        await page.getByRole('button', { name: 'Khách Rosa: 1 dịch vụ' }).click()
      }
      const panel = page.locator('.treatment-root-panel').first()
      await panel.getByRole('button', { name: /Gói chữa nám · 3 liệu trình con/ }).click()
      await expect(panel.getByRole('img')).toHaveCount(0)
      await expect(panel.getByRole('checkbox', { name: 'massage' })).toBeDisabled()
      await expect(panel.locator('.treatment-child-row button')).toHaveCount(0)
      await panel.getByRole('button', { name: 'Xem lịch sử' }).click()
      await expect(panel.getByText('30/10/2026 · CS1')).toBeVisible()
      await expect(panel.locator('.treatment-history-service-row')).toHaveCount(2)
      await expect(panel.locator('.treatment-history-service-row').filter({ hasText: 'pnp' })).toContainText('Lan')
      await expect(panel.locator('.treatment-history-service-row').filter({ hasText: 'laser' })).toContainText('Lan')
      await expect(panel.getByRole('img', { name: 'Chữ ký khách hàng xác nhận nhóm buổi thực hiện' })).toBeVisible()
      await panel.getByRole('button', { name: 'Ẩn lịch sử' }).click()
      await panel.getByRole('button', { name: 'Thực hiện' }).click()
      await panel.locator('.treatment-execution-form').getByRole('checkbox', { name: 'pnp', exact: true }).check()
      await panel.locator('.treatment-execution-form').getByRole('checkbox', { name: 'laser', exact: true }).check()
      await expect(panel.locator('.treatment-execution-form').getByRole('checkbox', { name: 'pnp', exact: true })).toBeChecked()
      await panel.getByRole('button', { name: 'Nhân viên làm pnp' }).click()
      await page.getByRole('dialog', { name: 'Nhân viên làm pnp' }).getByLabel('Lan').check()
      await page.getByRole('dialog', { name: 'Nhân viên làm pnp' }).getByRole('button', { name: 'Xong' }).click()
      await panel.getByRole('button', { name: 'Nhân viên làm laser' }).click()
      await page.getByRole('dialog', { name: 'Nhân viên làm laser' }).getByLabel('Lan').check()
      await page.getByRole('dialog', { name: 'Nhân viên làm laser' }).getByRole('button', { name: 'Xong' }).click()
      await panel.getByRole('button', { name: 'Xác nhận' }).click()
      await page.getByRole('button', { name: 'Ghi nhận không có chữ ký' }).click()
      await expect(panel.getByRole('status')).toContainText('Đã ghi nhận 2 dịch vụ')
      expect(executed.map(body => body.treatment_id)).toEqual([11, 12])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (!customerPage) {
        await page.getByRole('button', { name: 'Khách Rosa: 1 đã hoàn thành' }).click()
        await expect(page.getByRole('button', { name: 'Ký kết thúc liệu trình' })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Thực hiện', exact: true })).toHaveCount(0)
      }
    })
  }
}