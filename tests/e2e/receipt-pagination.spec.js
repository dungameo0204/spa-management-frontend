import { test, expect } from './fixtures'

test('hóa đơn giấy thường nhiều sản phẩm có tiêu đề lặp và tổng kết liền khối', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } }))
    localStorage.setItem('xuly.theme', 'dark')
  })
  const invoice = { id: 21, customer_name: 'Khách hàng thử nghiệm', branch_name: 'Cơ sở Một', branch_address: '123 Đường Hoa Hồng, Quận 1, TP. Hồ Chí Minh', invoice_date: '2026-10-10', total_amount: 12000000, paid_amount: 12000000, wallet_used: 0, debt_amount: 0, payment_method: 'CASH', discount_percent: 2, discount_amount: 0, items: Array.from({ length: 25 }, (_, index) => ({ id: index + 1, snapshot_name: `Liệu trình chăm sóc da số ${index + 1}`, quantity: 1, snapshot_price: 500000, discount_percent: index === 0 ? 10 : 0, discount_amount: 0, final_price: index === 0 ? 450000 : 500000 })) }
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/invoices/21') return route.fulfill({ json: { data: invoice } })
    return route.fulfill({ json: { data: path === '/api/invoices' ? [invoice] : [], total: path === '/api/invoices' ? 1 : 0 } })
  })
  await page.goto('/invoices')
  await page.getByRole('row', { name: /Khách hàng thử nghiệm/ }).click()
  await page.evaluate(() => { window.print = () => {} })
  for (const size of ['A4', 'A5']) {
    await page.getByRole('combobox', { name: 'Khổ giấy in' }).selectOption(size)
    await page.getByRole('button', { name: 'In hóa đơn' }).click()
    await expect(page.locator('#receipt-print .receipt-pages tbody tr')).toHaveCount(25)
    await expect(page.locator('#receipt-print')).toContainText('Địa chỉ: 123 Đường Hoa Hồng, Quận 1, TP. Hồ Chí Minh')
    await expect(page.locator('#receipt-print .receipt-head > .receipt-brand')).toContainText('Cơ sở Một')
    await expect(page.locator('#receipt-print img[alt="ROSA"]')).toHaveAttribute('src', '/icons/icon-512.png')
    await expect(page.locator('#receipt-print > .receipt-summary')).toHaveCount(1)
    await expect(page.locator('#receipt-print .receipt-line').first()).toContainText(/Chiết khấu: -50\.000\s*₫/)
    await expect(page.locator('#receipt-print .receipt-line').nth(1)).not.toContainText('Chiết khấu')
    await expect(page.locator('#receipt-print .receipt-summary')).toContainText('Chiết khấu hóa đơn')
    await expect(page.locator('#receipt-print .receipt-summary')).toContainText(/-450\.000\s*₫/)
    await page.emulateMedia({ media: 'print' })
    const pageMargins = await page.locator('#receipt-print > style').evaluate(style => [...style.sheet.cssRules].map(rule => ({ selector: rule.selectorText, top: rule.style.marginTop, right: rule.style.marginRight })))
    expect(pageMargins).toEqual([
      { selector: '', top: '32mm', right: '12mm' },
      { selector: ':first', top: '12mm', right: '' },
    ])
    const layout = await page.locator('#receipt-print').evaluate(el => { const wrapper = el.getBoundingClientRect(), logoElement = el.querySelector('.receipt-logo'), logo = logoElement.getBoundingClientRect(), branch = el.querySelector('.receipt-brand strong').getBoundingClientRect(), address = el.querySelector('.receipt-branch-address').getBoundingClientRect(), metadata = el.querySelector('.receipt-document-meta').getBoundingClientRect(), lineStyle = getComputedStyle(el.querySelector('.receipt-line')), branchStyle = getComputedStyle(el.querySelector('.receipt-head strong')), titleStyle = getComputedStyle(el.querySelector('.receipt-title h2')); return { display: getComputedStyle(el).display, height: wrapper.height, heading: getComputedStyle(el.querySelector('thead')).display, headingBackground: getComputedStyle(el.querySelector('thead')).backgroundColor, headingCellBackground: getComputedStyle(el.querySelector('thead td')).backgroundColor, summary: getComputedStyle(el.querySelector('.receipt-summary')).breakInside, priceColor: getComputedStyle(el.querySelector('.receipt-line strong')).color, totalColor: getComputedStyle(el.querySelector('.receipt-row strong')).color, logoRight: logo.right, branchLeft: branch.left, logoCenter: logo.top + logo.height / 2, branchCenter: branch.top + branch.height / 2, logoBottom: logo.bottom, branchBottom: branch.bottom, addressTop: address.top, logoWidth: logo.width, logoLoaded: logoElement.complete && logoElement.naturalWidth > 0, separatorLeft: metadata.left, separatorRight: metadata.right, linePaddingLeft: lineStyle.paddingLeft, linePaddingRight: lineStyle.paddingRight, branchFont: branchStyle.fontFamily, branchWeight: branchStyle.fontWeight, titleFont: titleStyle.fontFamily, titleWeight: titleStyle.fontWeight, wrapperLeft: wrapper.left, wrapperRight: wrapper.right }
    })
    expect(layout).toMatchObject({ display: 'block', heading: 'table-header-group', headingBackground: 'rgb(255, 255, 255)', headingCellBackground: 'rgb(255, 255, 255)', summary: 'avoid', priceColor: 'rgb(24, 44, 39)', totalColor: 'rgb(24, 44, 39)' })
    expect(layout.height).toBeGreaterThan(0)
    expect(layout.logoRight).toBeLessThanOrEqual(layout.branchLeft)
    expect(Math.abs(layout.logoCenter - layout.branchCenter)).toBeLessThanOrEqual(2)
    expect(layout.addressTop).toBeGreaterThanOrEqual(Math.max(layout.logoBottom, layout.branchBottom))
    expect(layout.logoWidth).toBeGreaterThan(0)
    expect(layout.logoLoaded).toBe(true)
    expect(layout.separatorLeft).toBeCloseTo(layout.wrapperLeft, 0)
    expect(layout.separatorRight).toBeCloseTo(layout.wrapperRight, 0)
    expect(parseFloat(layout.linePaddingLeft)).toBeGreaterThan(0)
    expect(parseFloat(layout.linePaddingRight)).toBeGreaterThan(0)
    expect(layout.branchFont).toMatch(/Palatino|Georgia/)
    expect(layout.titleFont).toMatch(/Palatino|Georgia/)
    expect(Number(layout.branchWeight)).toBeGreaterThanOrEqual(700)
    expect(Number(layout.titleWeight)).toBeGreaterThanOrEqual(700)
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length
    expect(pages).toBeGreaterThanOrEqual(1)
    expect(pages).toBeLessThan(5)
    await page.emulateMedia({ media: 'screen' })
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  }
})