import { test, expect } from './fixtures'
import { createRequire } from 'node:module'
const ExcelJS = createRequire(import.meta.url)('exceljs')

for (const path of ['/commissions', '/reports']) {
  for (const width of [1440, 390]) {
    test(`báo cáo mức công ca từng nhân viên ${path} ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const requests = []
      await page.route('**/api/**', route => {
        const url = new URL(route.request().url()), api = url.pathname
        if (!api.startsWith('/api/')) return route.continue()
        if (api === '/api/auth/login') return route.fulfill({ json: { data: { token: 'manager-test', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
        if (api === '/api/reports/commissions') return route.fulfill({ json: { staffTotals: [{ branch_id: 2, branch_name: 'Cơ sở 2', staff_id: 3, staff_name: 'Nhân viên B', record_count: 3, total_amount: 90000 }], total: 1, totalAmount: 90000, totalPages: 1 } })
        if (api === '/api/reports/revenue') return route.fulfill({ json: { daily: [{ date: '2026-10-01', totalRevenue: 1200000, netCashFlow: -50000 }] } })
        if (api === '/api/reports/details/commissions') {
          requests.push(Object.fromEntries(url.searchParams))
          const second = url.searchParams.get('page') === '2'
          return route.fulfill({ json: { data: second ? [{ id: 3, commission_amount: '20000.00' }] : [{ id: 1, commission_amount: 20000 }, { id: 2, commission_amount: 50000 }], total: 3, totalPages: 2, totalAmount: 90000 } })
        }
        return route.fulfill({ json: { data: [], total: 0 } })
      })
      await page.goto('/login')
      await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
      await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
      await page.getByRole('button', { name: 'Đăng nhập' }).click()
      await page.goto(path)
      if (path === '/reports') await page.getByRole('tab', { name: 'Công ca', exact: true }).click()
      await page.getByRole('button', { name: 'Xem báo cáo công ca', exact: true }).click()
      const drawer = page.getByRole('region', { name: 'Báo cáo công ca Nhân viên B', exact: true })
      await expect(drawer).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(await drawer.evaluate(el => el.getBoundingClientRect().top >= el.closest('.staff-group').querySelector('header').getBoundingClientRect().bottom)).toBe(true)
      const rows = drawer.getByRole('table', { name: 'Công ca theo mức tiền' }).locator('tbody tr')
      await expect(rows).toHaveCount(2)
      await expect(rows.nth(0).locator('td').nth(0)).toContainText('20.000')
      await expect(rows.nth(0).locator('td').nth(1)).toHaveText('2')
      await expect(rows.nth(0).locator('td').nth(2)).toContainText('40.000')
      await expect(rows.nth(1).locator('td').nth(0)).toContainText('50.000')
      await expect(rows.nth(1).locator('td').nth(1)).toHaveText('1')
      await expect(rows.nth(1).locator('td').nth(2)).toContainText('50.000')
      await expect(drawer.getByText('Tổng cộng · 3 ca')).toBeVisible()
      await expect(drawer.locator('.report-total strong')).toContainText('90.000')
      expect(requests.filter(r => r.staffId === '3').map(r => r.page)).toEqual(['1', '2'])
      expect(requests.filter(r => r.staffId === '3').every(r => r.branchId === '2' && r.startDate && r.endDate)).toBe(true)
      expect(await drawer.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
      const downloaded = page.waitForEvent('download')
      await drawer.getByRole('button', { name: 'Xuất Excel', exact: true }).click()
      const download = await downloaded
      expect(download.suggestedFilename()).toMatch(/^Xuly-cong-ca-3-2-.*\.xlsx$/)
      const book = new ExcelJS.Workbook()
      await book.xlsx.readFile(await download.path())
      const sheet = book.worksheets[0]
      expect(sheet.getRow(4).values.slice(1)).toEqual(['Ca', 'Số lượng', 'Tổng tiền'])
      expect(sheet.getRow(5).values.slice(1)).toEqual([20000, 2, 40000])
      expect(sheet.getRow(6).values.slice(1)).toEqual([50000, 1, 50000])
      expect(sheet.getRow(7).values.slice(1)).toEqual(['Tổng cộng', 3, 90000])
      await page.getByRole('button', { name: 'Thu gọn báo cáo công ca', exact: true }).click()
      await expect(drawer).toHaveCount(0)
      const allDownloaded = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Xuất Excel công ca toàn bộ nhân viên', exact: true }).click()
      const allDownload = await allDownloaded
      expect(allDownload.suggestedFilename()).toMatch(/^Xuly-cong-ca-tat-ca-nhan-vien-.*\.xlsx$/)
      const allBook = new ExcelJS.Workbook()
      await allBook.xlsx.readFile(await allDownload.path())
      expect(allBook.getWorksheet('Công ca theo mức tiền')).toBeUndefined()
      expect(allBook.getWorksheet('Nhân viên B').getRow(5).values.slice(1)).toEqual([20000, 2, 40000])
      expect(allBook.getWorksheet('Nhân viên B').getRow(7).values.slice(1)).toEqual(['Tổng cộng', 3, 90000])
      if (path === '/reports') {
        const fullDownloaded = page.waitForEvent('download')
        await page.getByRole('button', { name: 'Xuất Excel toàn kỳ', exact: true }).click()
        const fullDownload = await fullDownloaded
        const fullBook = new ExcelJS.Workbook()
        await fullBook.xlsx.readFile(await fullDownload.path())
        expect(fullBook.worksheets).toHaveLength(9)
        expect(fullBook.getWorksheet('Nhân viên B').getRow(5).values.slice(1)).toEqual([20000, 2, 40000])
        expect(fullBook.getWorksheet('Doanh thu theo ngày').getCell('B5').value).toBe(1200000)
        expect(fullBook.getWorksheet('Doanh thu theo ngày').getCell('M5').value).toBe(-50000)
      }
    })
  }
}