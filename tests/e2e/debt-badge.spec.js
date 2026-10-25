import { test, expect } from './fixtures'

for (const theme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    test(`tiền nợ chỉ có nhãn đỏ khi lớn hơn 0 (${theme}, ${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(theme => {
        localStorage.setItem('xuly.theme', theme)
        localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } }))
      }, theme)
      const customers = [
        { id: 1, fullname: 'Khách còn nợ', phone_number: '0900000001', total_debt: '250000.00', wallet_balance: 0 },
        { id: 2, fullname: 'Khách hết nợ', phone_number: '0900000002', total_debt: '0.00', wallet_balance: 0 },
      ]
      const invoices = customers.map(customer => ({ id: customer.id, customer_id: customer.id, customer_name: customer.fullname, debt_amount: customer.total_debt, total_amount: 300000, paid_amount: 50000, wallet_used: 0, branch_id: 1, branch_name: 'Cơ sở Một', invoice_date: '2026-10-16', items: [] }))
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        if (!path.startsWith('/api/')) return route.continue()
        if (path === '/api/customers') return route.fulfill({ json: { data: customers, total: 2 } })
        if (/^\/api\/customers\/[12]\/overview$/.test(path)) return route.fulfill({ json: { data: { customer: customers[Number(path.split('/')[3]) - 1], timeline: [] } } })
        if (/^\/api\/customers\/[12]$/.test(path)) return route.fulfill({ json: { data: customers[Number(path.split('/')[3]) - 1] } })
        if (path === '/api/invoices') return route.fulfill({ json: { data: invoices, total: 2 } })
        if (/^\/api\/invoices\/[12]$/.test(path)) return route.fulfill({ json: { data: invoices[Number(path.split('/')[3]) - 1] } })
        if (path === '/api/treatments') return route.fulfill({ json: { data: customers.map(customer => ({ id: customer.id, customer_id: customer.id, customer_name: customer.fullname, product_name: 'Chăm sóc da', remaining_sessions: 2, total_sessions: 5 })), total: 2 } })
        return route.fulfill({ json: { data: [], total: 0 } })
      })

      for (const path of ['/treatments', '/invoices', '/customers']) {
        await page.goto(path)
        const rows = page.locator('tbody > tr')
        const owing = rows.filter({ hasText: 'Khách còn nợ' })
        const paid = rows.filter({ hasText: 'Khách hết nợ' })
        await expect(owing.locator('.debt-badge')).toContainText('250.000')
        await expect(paid).toBeVisible()
        await expect(paid.locator('.debt-badge')).toHaveCount(0)
        const styles = await owing.locator('.debt-badge').evaluate(element => {
          const style = getComputedStyle(element)
          return { color: style.color, background: style.backgroundColor, radius: style.borderRadius, nowrap: style.whiteSpace }
        })
        expect(styles).toEqual({ color: theme === 'dark' ? 'rgb(255, 171, 179)' : 'rgb(180, 35, 45)', background: theme === 'dark' ? 'rgb(84, 43, 48)' : 'rgb(254, 228, 230)', radius: '8px', nowrap: 'nowrap' })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        if (path === '/invoices') {
          await owing.click()
          const drawer = page.getByRole('dialog')
          await expect(drawer.locator('.debt-badge')).toContainText('250.000')
          await drawer.getByRole('button', { name: 'Chỉnh sửa' }).click()
          await expect(drawer.locator('.helper-text .debt-badge')).toContainText('250.000')
        }
        if (path === '/customers') {
          await owing.click()
          await expect(page.locator('.customer-identity .debt-badge')).toContainText('250.000')
        }
      }
    })
  }
}