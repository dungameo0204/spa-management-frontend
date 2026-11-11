import { test, expect } from './fixtures'

async function mockApp(page, debt = 250000) {
  await page.clock.setFixedTime(new Date('2026-11-06T10:00:00+07:00'))
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF', fullname: 'Nhân viên' } })))
  const customer = { id: 17, fullname: 'Khách kiểm tra', phone_number: '0900000017', total_debt: debt, legacy_debt: 0, wallet_balance: 0 }
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/customers/17/overview') return route.fulfill({ json: { data: { customer, timeline: [] } } })
    if (path === '/api/customers/17') return route.fulfill({ json: { data: customer } })
    if (path === '/api/customers') {
      const current = Number(url.searchParams.get('page') || 1)
      return route.fulfill({ json: { data: current === 1 ? [customer] : [{ ...customer, id: 18, fullname: 'Khách trang hai' }], total: 21, totalPages: 2, page: current, pageSize: 20 } })
    }
    if (path === '/api/treatments') {
      const day = url.searchParams.get('executionStartDate') || url.searchParams.get('startDate')
      const data = Array.from({ length: 21 }, (_, index) => ({ id: index + 1, customer_name: `Khách dịch vụ ${index + 1}`, product_name: 'Chăm sóc da', created_at: '2020-01-01', remaining_sessions: 2, histories: [{ id: index + 100, execution_date: `${day} 09:00:00`, branch_id: 1, staffs: [] }] }))
      return route.fulfill({ json: { data, total: 21, totalPages: 1 } })
    }
    return route.fulfill({ json: { data: [], total: 0, totalPages: 0 } })
  })
}

for (const width of [1440, 390, 320]) {
  test(`điều hướng khách đặt lịch giữ riêng lịch hẹn nội bộ ở ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockApp(page)
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: width === 1440 ? 'Điều hướng chính' : 'Điều hướng nhanh' })
    await nav.getByRole('link', { name: 'Khách đặt lịch', exact: true }).click()
    await expect(page).toHaveURL(/\/bookings$/)
    await expect(page.getByRole('heading', { name: 'Khách đặt lịch', exact: true })).toBeVisible()
    await expect(page.locator('.topbar-title')).toContainText('Khách đặt lịch')
    await expect(nav.getByRole('link', { name: 'Lịch hẹn', exact: true })).toHaveAttribute('href', '/appointments')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test(`ngày cùng một dòng và phân trang dashboard hoạt động ở ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockApp(page)
    await page.goto('/')
    const group = page.getByRole('group', { name: 'Chọn ngày xem khách hàng' })
    await expect(group).toBeVisible()
    const layout = await group.evaluate(element => {
      const boxes = [...element.querySelectorAll('input, button')].map(control => control.getBoundingClientRect())
      return { sameLine: boxes.every(box => Math.abs(box.bottom - boxes[0].bottom) < 2), fits: boxes.every(box => box.left >= 0 && box.right <= innerWidth), noOverflow: document.documentElement.scrollWidth <= innerWidth }
    })
    expect(layout).toEqual({ sameLine: true, fits: true, noOverflow: true })
    const section = group.locator('xpath=ancestor::section[1]')
    await expect(section.locator('tbody > tr')).toHaveCount(20)
    await section.getByRole('button', { name: 'Trang sau' }).click()
    await expect(section.locator('tbody > tr')).toHaveCount(1)
    await expect(section).toContainText('Khách dịch vụ 21')
    await expect(section.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
    await group.getByRole('button', { name: 'Ngày trước' }).click()
    await expect(group.getByLabel('Ngày xem', { exact: true })).toHaveValue('2026-11-05')
    await expect(section.locator('tbody > tr')).toHaveCount(20)
    await group.getByRole('button', { name: 'Hôm nay', exact: true }).click()
    await expect(group.getByLabel('Ngày xem', { exact: true })).toHaveValue('2026-11-06')
  })
}

test('bảng khách hàng chuyển trang và nút thu nợ mở phiếu thu đúng khách', async ({ page }) => {
  await mockApp(page)
  await page.goto('/customers')
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Khách trang hai', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Trang trước' }).click()
  await page.getByRole('cell', { name: 'Khách kiểm tra', exact: true }).click()
  await page.getByRole('link', { name: 'Thu nợ', exact: true }).click()
  await expect(page).toHaveURL(/\/debts\?customerId=17$/)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Tìm khách hàng' })).toHaveValue('Khách kiểm tra')
  await expect(page.getByLabel('Mã khách hàng đã chọn')).toHaveValue('17')
})

for (const debt of [0, null]) {
  test(`không hiện thu nợ khi tổng nợ là ${debt}`, async ({ page }) => {
    await mockApp(page, debt)
    await page.goto('/customers')
    await page.getByRole('cell', { name: 'Khách kiểm tra', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Lịch sử mua và chăm sóc' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Thu nợ', exact: true })).toHaveCount(0)
  })
}