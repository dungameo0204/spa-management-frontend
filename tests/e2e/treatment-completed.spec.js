import { test, expect } from './fixtures'

for (const width of [1440, 390]) {
  test(`cột Đã hoàn thành cạnh Dịch vụ ở màn ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem('xuly.theme', 'dark')
      localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } }))
    })
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      const cards = [
        { id: 10, customer_id: 1, customer_name: 'Khách còn buổi', product_name: 'Massage', remaining_sessions: 2, total_sessions: 3, created_at: '2026-10-01' },
        { id: 11, customer_id: 1, customer_name: 'Khách còn buổi', product_name: 'Chăm sóc da', remaining_sessions: 0, total_sessions: 5, created_at: '2026-09-01' },
        { id: 12, customer_id: 2, customer_name: 'Khách đã xong', product_name: 'Triệt lông', remaining_sessions: 0, total_sessions: 5, created_at: '2026-09-01' },
      ]
      if (path === '/api/treatments') return route.fulfill({ json: { data: cards, total: cards.length } })
      if (path === '/api/treatments/11' || path === '/api/treatments/12') return route.fulfill({ json: { data: { ...cards.find(card => path.endsWith(`/${card.id}`)), histories: [{ id: 91, execution_date: '2026-09-25', staffs: [] }] } } })
      if (path === '/api/customers/2') return route.fulfill({ json: { data: { id: 2, phone_number: '0900000000', total_debt: 0 } } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/treatments')
    await expect(page.getByRole('tab')).toHaveCount(0)
    if (width > 767) await expect(page.locator('.treatment-customers thead th')).toHaveText(['Khách hàng', 'Số điện thoại', 'Tiền nợ', 'Dịch vụ', 'Đã hoàn thành'])
    const row = page.locator('.treatment-customers tbody tr.clickable', { hasText: 'Khách còn buổi' })
    await expect(row.getByRole('button', { name: 'Khách còn buổi: 1 dịch vụ' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'Khách còn buổi: 1 đã hoàn thành' })).toBeVisible()
    await row.getByRole('button', { name: 'Khách còn buổi: 1 dịch vụ' }).click()
    await expect(page.locator('.treatment-card-item .treatment-sessions')).toHaveText('Còn 2/3 buổi')
    await row.getByRole('button', { name: 'Khách còn buổi: 1 đã hoàn thành' }).click()
    const card = page.locator('.treatment-card-item')
    await expect(card.locator('.treatment-sessions')).toHaveText('Còn 0/5 buổi')
    await expect(card).toContainText('Đã hoàn thành')
    await expect(card.getByRole('button', { name: 'Thực hiện hôm nay' })).toHaveCount(0)
    await card.getByRole('button', { name: /Chăm sóc da.*Xem lịch sử/ }).click()
    await expect(page.getByRole('dialog', { name: 'Chăm sóc da' })).toContainText('Lịch sử thực hiện')
    await page.getByRole('dialog', { name: 'Chăm sóc da' }).getByRole('button', { name: /Đóng/ }).click()
    const doneOnly = page.locator('.treatment-customers tbody tr.clickable', { hasText: 'Khách đã xong' })
    await expect(doneOnly.getByRole('button', { name: /dịch vụ/ })).toHaveCount(0)
    await doneOnly.getByRole('button', { name: 'Khách đã xong: 1 đã hoàn thành' }).click()
    await expect(page.locator('.treatment-card-item .treatment-sessions')).toHaveText('Còn 0/5 buổi')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const width of [1920, 1440, 1366, 1280, 1100, 768, 390, 320]) {
  test(`căn thẳng cột số buổi giữa thẻ còn buổi và vừa hết buổi ở màn ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.clock.setFixedTime(new Date('2026-10-16T12:00:00'))
    await page.addInitScript(() => {
      localStorage.setItem('xuly.theme', 'dark')
      localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } }))
    })
    const today = '2026-10-16'
    const cards = [
      { id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Liệu trình triệt lông nách 5 buổi', remaining_sessions: 3, total_sessions: 5, created_at: today },
      { id: 11, customer_id: 1, customer_name: 'Khách A', product_name: 'Massage', remaining_sessions: 8, total_sessions: 10, created_at: today },
      { id: 12, customer_id: 1, customer_name: 'Khách A', product_name: 'Nặn mụn cơ bản', remaining_sessions: 0, total_sessions: 5, created_at: today },
    ]
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/treatments') return route.fulfill({ json: { data: cards, total: cards.length } })
      if (path === '/api/treatments/12') return route.fulfill({ json: { data: { ...cards[2], histories: [{ id: 7, execution_date: today }] } } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/treatments')
    await expect(page.locator('.treatment-customers')).toBeVisible()
    await page.getByRole('button', { name: 'Khách A: 3 dịch vụ' }).click()
    const sessionCells = page.locator('.treatment-card-item .treatment-sessions')
    await expect(sessionCells).toHaveText(['Còn 3/5 buổi', 'Còn 8/10 buổi', 'Còn 0/5 buổi'])
    await expect(page.locator('.treatment-completed-label')).toHaveText('Đã hoàn tất hôm nay')
    const badge = page.locator('.treatment-card-item .today-execution-badge')
    const badgeLayout = await badge.evaluate(element => {
      const range = document.createRange()
      range.selectNodeContents(element)
      const bounds = element.getBoundingClientRect()
      const cell = element.parentElement.getBoundingClientRect()
      const card = element.closest('.treatment-card-item').getBoundingClientRect()
      return { lines: new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size, fitsCell: bounds.right <= cell.right + 1, fitsCard: bounds.right <= card.right, height: bounds.height }
    })
    expect(badgeLayout.lines).toBe(1)
    expect(badgeLayout.fitsCell).toBe(true)
    expect(badgeLayout.fitsCard).toBe(true)
    expect(badgeLayout.height).toBeLessThanOrEqual(32)
    const positions = await sessionCells.evaluateAll(elements => elements.map(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, cardRight: element.closest('.treatment-card-item').getBoundingClientRect().right })))
    expect(Math.max(...positions.map(position => position.left)) - Math.min(...positions.map(position => position.left))).toBeLessThan(2)
    expect(positions.every(position => position.right <= position.cardRight)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}