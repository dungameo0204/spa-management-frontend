import { test, expect } from './fixtures'
import { createRequire } from 'node:module'

const ExcelJS = createRequire(import.meta.url)('exceljs')

for (const resource of ['customers', 'products', 'inventory', 'treatments']) {
  test(`${resource}: downloads a readable workbook containing all pages`, async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'export-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url())
      if (!url.pathname.startsWith('/api/')) return route.continue()
      const currentPage = Number(url.searchParams.get('page') || 1)
      const id = currentPage
      const customer = { id, fullname: `Khách ${id}`, phone_number: '0901234567', wallet_balance: '120000', total_debt: '0' }
      if (url.pathname === '/api/customers') return route.fulfill({ json: { data: [customer], total: 2, totalPages: 2 } })
      if (/^\/api\/customers\/\d+$/.test(url.pathname)) return route.fulfill({ json: { data: customer } })
      if (url.pathname === '/api/products') return route.fulfill({ json: { data: [{ id, name: `Kem ${id}`, is_product: 1, price: '100000', sale_price: '90000', inventory: [{ branch_id: 1, branch_name: 'Cơ sở A', quantity: id }] }], total: 2, totalPages: 2 } })
      if (url.pathname === '/api/treatments') return route.fulfill({ json: { data: [{ id, customer_id: id, customer_name: `Khách ${id}`, product_name: 'Laser', remaining_sessions: 2, total_sessions: 5 }], total: 2, totalPages: 2 } })
      return route.fulfill({ json: { data: [], total: 0, totalPages: 0 } })
    })
    await page.goto(`/${resource}`)
    if (resource === 'treatments') {
      const actions = page.getByRole('group', { name: 'Thao tác liệu trình' })
      await expect(actions.getByRole('button', { name: 'Tạo thẻ' })).toBeVisible()
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 })
        const layout = await actions.evaluate(element => {
          const buttons = [...element.querySelectorAll('button')].map(button => button.getBoundingClientRect())
          return { sameRow: Math.abs(buttons[0].top - buttons[1].top) < 2, fits: buttons.every(box => box.left >= 0 && box.right <= innerWidth) }
        })
        expect(layout).toEqual({ sameRow: true, fits: true })
      }
    }
    const button = page.getByRole('button', { name: 'Xuất Excel', exact: true })
    await expect(button).toBeEnabled().catch(async error => { throw new Error(`${error.message}\nURL: ${page.url()}\nPage errors: ${pageErrors.join('; ')}\nBody: ${await page.locator('body').innerText()}`) })
    const downloadPromise = page.waitForEvent('download')
    await button.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^Xuly-.*\.xlsx$/)
    const book = new ExcelJS.Workbook()
    await book.xlsx.readFile(await download.path())
    const sheet = book.worksheets[0]
    expect(sheet.rowCount).toBe(6)
    if (resource === 'customers') {
      expect(sheet.getCell('B5').value).toBe('0901234567')
      expect(sheet.getCell('E5').value).toBe(120000)
    }
    if (resource === 'inventory') expect(sheet.getCell('C6').value).toBe(2)
    if (resource === 'treatments') expect(sheet.getCell('E6').value).toBe(2)
    await expect(button).toBeEnabled()
  })
}