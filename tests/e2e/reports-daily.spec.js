import { test, expect } from '@playwright/test'

for (const width of [1440, 768, 390, 320]) {
  test(`báo cáo theo ngày hiển thị đúng tiền và cuộn trong bảng (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url()), path = url.pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'manager-test', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
      if (path === '/api/reports/revenue') return route.fulfill({ json: { daily: url.searchParams.get('startDate') === '2026-09-01' ? [] : [
        { date: '2026-10-01', totalRevenue: 1200000, serviceRevenue: 1000000, productRevenue: 200000, receipts: { invoiceCash: 500000, debtPayments: 100000, walletTopups: 300000, total: 900000, walletUsedExcluded: 400000 }, expenses: { expenseVouchers: 600000, inventoryImports: 800000, total: 1400000 }, netCashFlow: -500000 },
        { date: '2026-10-02', totalRevenue: 0, serviceRevenue: 0, productRevenue: 0, receipts: { invoiceCash: 0, debtPayments: 0, walletTopups: 0, total: 0, walletUsedExcluded: 0 }, expenses: { expenseVouchers: 0, inventoryImports: 0, total: 0 }, netCashFlow: 0 },
      ] } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/login')
    await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
    await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await page.goto('/reports')
    const table = page.getByRole('table', { name: 'Báo cáo theo ngày', exact: true })
    await expect(table).toBeVisible()
    await expect(table.getByRole('columnheader')).toHaveCount(13)
    const rows = table.locator('tbody tr')
    await expect(rows).toHaveCount(2)
    const cells = rows.first().locator('th, td')
    const amounts = ['01/10/2026', '1.200.000', '1.000.000', '200.000', '500.000', '100.000', '300.000', '900.000', '400.000', '600.000', '800.000', '1.400.000', '-500.000']
    for (let index = 0; index < amounts.length; index++) await expect(cells.nth(index)).toContainText(amounts[index])
    await expect(rows.nth(1).locator('th')).toHaveText('02/10/2026')
    for (const cell of await rows.nth(1).locator('td').all()) await expect(cell).toHaveText(/0\s*₫/)
    const scroll = page.getByRole('region', { name: 'Bảng báo cáo theo ngày, cuộn ngang để xem các cột' })
    await scroll.scrollIntoViewIfNeeded()
    expect(await scroll.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
    await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth })
    await expect(table.getByRole('columnheader', { name: 'Dòng tiền thuần', exact: true })).toBeInViewport()
    await expect(table.getByRole('rowheader', { name: '01/10/2026' })).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    const positions = await page.evaluate(() => ({ stats: document.querySelector('.report-stats').getBoundingClientRect().bottom, daily: document.querySelector('.daily-revenue').getBoundingClientRect().top, products: document.querySelector('.daily-revenue + .section-card').getBoundingClientRect().top, dailyBottom: document.querySelector('.daily-revenue').getBoundingClientRect().bottom }))
    expect(positions.daily).toBeGreaterThanOrEqual(positions.stats)
    expect(positions.products).toBeGreaterThanOrEqual(positions.dailyBottom)
    await page.getByLabel('Từ ngày', { exact: true }).fill('2026-09-01')
    await expect(page.getByText('Chưa có dữ liệu theo ngày trong khoảng thời gian đã chọn.')).toBeVisible()
    await expect(table).toHaveCount(0)
  })
}