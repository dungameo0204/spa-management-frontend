import { test, expect } from './fixtures'

for (const width of [320, 360, 390, 430, 768, 960, 1030, 1032, 1100, 1101, 1440]) {
  for (const single of [false, true]) {
    test(`customer ${single ? 'single' : 'grouped'} actions fit ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: ({ 768: 1024, 960: 1440, 1030: 1376, 1032: 1376 })[width] || 900 })
      const customer = { id: 1, fullname: 'Khách mobile', phone_number: '0901234567', total_debt: 0, wallet_balance: 0 }
      const history = { id: 50, execution_date: '2026-11-02', branch_id: 1, staffs: [], note: 'Theo dõi da' }
      const child = { id: 11, customer_id: 1, product_name: 'Chăm sóc da', branch_id: 1, total_sessions: null, remaining_sessions: null, histories: [history] }
      const card = { ...child, id: 10, customer_name: customer.fullname, children: single ? [] : [child] }
      await page.addInitScript(() => {
        sessionStorage.setItem('xuly.branch', '1')
        localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, system_role: 'MANAGER' } }))
      })
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        if (!path.startsWith('/api/')) return route.continue()
        const data = path === '/api/customers' ? [customer]
          : path === '/api/customers/1/overview' ? { customer, timeline: [{ type: 'treatment', date: '2026-11-02', treatment: card }] }
            : path === '/api/branches' ? [{ id: 1, name: 'Cơ sở chính' }]
              : path === '/api/roles' ? [{ id: 4, name: 'Kỹ thuật viên' }]
                : path === '/api/staffs' ? [{ id: 2, fullname: 'Lan', role_id: 4, branch_id: 1 }] : []
        return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1, totalPages: 1 } })
      })
      await page.goto('/customers')
      await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
      const panel = page.locator('.customer-overview .treatment-root-panel').first()
      const actions = panel.locator('.is-drawer-actions')
      await expect(actions.locator('button')).toHaveCount(3)
      const assertRow = async () => {
        const boxes = await actions.locator('button').evaluateAll(nodes => nodes.map(node => {
          const { x, y, right } = node.getBoundingClientRect()
          return { x, y, right, fits: node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1 }
        }))
        expect(boxes.every(box => Math.abs(box.y - boxes[0].y) < 2 && box.fits), JSON.stringify(boxes)).toBe(true)
        const ordered = [...boxes].sort((a, b) => a.x - b.x)
        expect(ordered[0].right).toBeLessThanOrEqual(ordered[1].x)
        expect(ordered[1].right).toBeLessThanOrEqual(ordered[2].x)
        const parent = await actions.boundingBox()
        expect(boxes.every(box => box.x >= parent.x && box.right <= parent.x + parent.width + 1)).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
      await assertRow()
      if (width < 768) {
        await expect(panel.locator('.treatment-history-label-compact')).toBeVisible()
        for (const selector of ['.treatment-action-execute', '.treatment-history-toggle']) {
          await expect(panel.locator(selector)).toHaveCSS('padding-left', '8px')
          await expect(panel.locator(selector)).toHaveCSS('padding-right', '8px')
        }
      }
      if (width >= 768) {
        const timeline = await page.locator('.customer-timeline').boundingBox()
        const profile = await page.locator('.customer-profile-column').boundingBox()
        if (width <= 1100) {
          expect(profile.y).toBeGreaterThanOrEqual(timeline.y + timeline.height)
          expect(Math.abs(profile.x - timeline.x)).toBeLessThan(2)
          const panels = await page.locator('.customer-profile-column > section').evaluateAll(nodes => nodes.map(node => {
            const { x, y, right } = node.getBoundingClientRect()
            return { x, y, right }
          }))
          expect(panels).toHaveLength(2)
          expect(Math.abs(panels[0].y - panels[1].y)).toBeLessThan(2)
          expect(panels[0].right).toBeLessThanOrEqual(panels[1].x)
        } else {
          expect(profile.x).toBeGreaterThanOrEqual(timeline.x + timeline.width)
          expect(Math.abs(profile.y - timeline.y)).toBeLessThan(2)
        }
      }
      const toggle = panel.locator('.treatment-history-toggle')
      if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click()
      await panel.getByRole('button', { name: 'Xem lịch sử', exact: true }).click()
      await expect(panel.locator('.treatment-history')).toBeVisible()
      await assertRow()
      await panel.getByRole('button', { name: 'Ẩn lịch sử', exact: true }).click()
      await expect(panel.locator('.treatment-history')).toBeHidden()
      await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
      await expect(panel.locator('.treatment-execution-form')).toBeVisible()
      await assertRow()
      await page.screenshot({ path: `test-results/customer-actions-${single ? 'single' : 'grouped'}-${width}.png`, fullPage: true })
      await panel.getByRole('button', { name: 'Ký kết thúc liệu trình', exact: true }).click()
      await expect(page.getByRole('dialog', { name: 'Ký kết thúc liệu trình', exact: true })).toBeVisible()
    })
  }
}