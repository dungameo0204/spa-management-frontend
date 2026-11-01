import { test, expect } from './fixtures'

for (const width of [390, 768, 1024, 1440]) {
  test(`lịch đặt responsive ${width}: lọc giờ giữ NULL, tạo/sửa/xóa`, async ({ page }, testInfo) => {
    page.on('pageerror', error => console.error('Browser error:', error.message))
    await page.setViewportSize({ width, height: 1024 })
    let saved, updated, deleted = false
    const day = '2026-11-01'
    const rows = [
      { id: 1, customer_name: 'Khách chưa giờ', arrival_time: null },
      { id: 2, customer_name: 'Khách tám giờ', arrival_time: '08:00:00', promotion_note: 'Ưu đãi khách mới', note: 'Chuẩn bị hồ sơ\nNhắc khách đến sớm' },
      { id: 3, customer_name: 'Khách bảy giờ', arrival_time: '07:00:00' },
    ].map(row => ({ ...row, arrival_date: day, branch_id: 1, branch_name: 'Cơ sở Rosa', customer_type: 'NEW', customer_phone: '0901234567', status: 'PENDING', consultation_total: '150000' }))
    await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } })))
    await page.route('**/api/**', async route => {
      const req = route.request(), url = new URL(req.url())
      if (!url.pathname.startsWith('/api/')) return route.continue()
      if (url.pathname === '/api/customer-bookings' && req.method() === 'POST') { saved = req.postDataJSON(); return route.fulfill({ json: { bookingId: 4 } }) }
      if (url.pathname.startsWith('/api/customer-bookings/')) {
        if (req.method() === 'PUT') { updated = req.postDataJSON(); return route.fulfill({ json: { bookingId: 3 } }) }
        if (req.method() === 'DELETE') { deleted = true; return route.fulfill({ json: { bookingId: 3 } }) }
        return route.fulfill({ json: { data: rows.find(row => String(row.id) === url.pathname.split('/').pop()) } })
      }
      if (url.pathname === '/api/customer-bookings') return route.fulfill({ json: { total: rows.length, totalPages: 1, data: rows } })
      if (url.pathname === '/api/customers') return route.fulfill({ json: { data: [{ id: 8, fullname: 'Hoa đã đăng ký', phone_number: '0988888888' }], totalPages: 1 } })
      if (url.pathname === '/api/products') return route.fulfill({ json: { data: [{ id: 9, name: 'Chăm sóc da' }], totalPages: 1 } })
      return route.fulfill({ json: { data: [], totalPages: 0 } })
    })
    await page.goto('/customer-bookings')
    await expect(page.getByRole('heading', { name: 'Khách đặt lịch', exact: true })).toBeVisible()
    await page.getByLabel('Từ ngày', { exact: true }).fill(day)
    await page.getByLabel('Đến ngày', { exact: true }).fill(day)
    const request = page.waitForRequest(req => req.url().includes('startTime=07%3A00') && req.url().includes('endTime=08%3A00'))
    if (width < 768) {
      await page.getByLabel('Từ giờ', { exact: true }).and(page.locator('select')).selectOption('07:00')
      await page.getByLabel('Đến giờ', { exact: true }).and(page.locator('select')).selectOption('08:00')
    } else {
      await page.locator('.booking-time-field', { hasText: 'Từ giờ' }).locator('.mobile-select-trigger').click()
      await page.getByRole('listbox', { name: 'Từ giờ' }).getByRole('option', { name: '07:00', exact: true }).click()
      await page.locator('.booking-time-field', { hasText: 'Đến giờ' }).locator('.mobile-select-trigger').click()
      await page.getByRole('listbox', { name: 'Đến giờ' }).getByRole('option', { name: '08:00', exact: true }).click()
    }
    await request
    const cards = page.locator('.booking-card')
    await expect(cards).toHaveCount(3)
    await expect(cards.nth(0)).toContainText('Khách bảy giờ')
    await expect(cards.nth(1)).toContainText('Khách tám giờ')
    await expect(cards.nth(1)).toContainText('Nhu cầu / ưu đãi: Ưu đãi khách mới')
    await expect(cards.nth(1)).toContainText('Ghi chú cho nhân viên: Chuẩn bị hồ sơ')
    await expect(cards.nth(1)).toContainText('Nhắc khách đến sớm')
    await expect(cards.nth(1).locator('.booking-card-notes')).toContainText('Ưu đãi khách mới')
    await expect(cards.nth(1).locator('.booking-card-notes')).toContainText('Chuẩn bị hồ sơ')
    await expect(cards.nth(2)).toContainText('Chưa chọn giờ')
    const quickActions = page.locator('.booking-filter-actions')
    const filterGrid = page.locator('.booking-filter-grid')
    expect((await quickActions.boundingBox()).y).toBeLessThan((await filterGrid.boundingBox()).y)
    await expect(quickActions.getByRole('button', { name: '7 ngày tiếp' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Xóa bộ lọc' })).toBeVisible()
    expect((await page.locator('.booking-filter-reset').boundingBox()).y).toBeGreaterThan((await filterGrid.boundingBox()).y)
    const heading = page.getByLabel('Tiêu đề cột lịch đặt').first()
    if (width >= 1200) {
      await expect(heading).toBeVisible()
      const columns = await page.evaluate(() => {
        const head = document.querySelector('.booking-table-heading')
        const card = document.querySelector('.booking-card')
        return [head, card].map(row => getComputedStyle(row).gridTemplateColumns)
      })
      expect(columns[0]).toBe(columns[1])
      const time = await cards.nth(2).locator('.booking-card-time').boundingBox()
      const customer = await cards.nth(2).locator('.booking-card-main').boundingBox()
      expect(customer.x - (time.x + time.width)).toBeGreaterThanOrEqual(12)
    } else await expect(heading).toBeHidden()
    const filterPicker = page.getByRole('form', { name: 'Lọc lịch đặt' }).getByRole('combobox', { name: 'Tìm dịch vụ quan tâm' })
    await filterPicker.click()
    const filterOptions = page.getByRole('form', { name: 'Lọc lịch đặt' }).getByRole('listbox')
    await expect(filterOptions.getByRole('option').first()).toHaveText('Tất cả dịch vụ')
    await page.getByRole('heading', { name: 'Khách đặt lịch', exact: true }).click()
    await expect(filterPicker).toHaveAttribute('aria-expanded', 'false')
    await expect(filterOptions).toHaveCount(0)
    await filterPicker.fill('da')
    const selected = page.waitForRequest(req => req.url().includes('/api/customer-bookings') && new URL(req.url()).searchParams.get('productId') === '9' && new URL(req.url()).searchParams.get('startTime') === '07:00')
    await page.getByRole('option', { name: 'Chăm sóc da' }).click()
    await selected
    await expect(filterPicker).toHaveValue('Chăm sóc da')
    await filterPicker.click()
    await expect(filterOptions.getByRole('option').first()).toHaveText('Tất cả dịch vụ')
    await filterOptions.getByRole('option', { name: 'Tất cả dịch vụ' }).click()
    await expect(filterPicker).toHaveValue('')
    await expect(filterPicker).toHaveAttribute('aria-expanded', 'false')
    await expect(filterOptions).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tất cả dịch vụ' })).toHaveCount(0)
    await expect(page.locator('.booking-time-field', { hasText: 'Từ giờ' }).locator('select')).toHaveValue('07:00')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`bookings-${width}.png`), fullPage: true })
    await page.getByRole('button', { name: 'Tạo lịch đặt', exact: true }).click()
    await page.getByRole('button', { name: 'Khách cũ', exact: true }).click()
    await page.getByRole('combobox', { name: 'Tìm khách hàng đã đăng ký' }).fill('Hoa')
    await page.getByRole('option', { name: /Hoa đã đăng ký/ }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('combobox', { name: 'Tìm dịch vụ quan tâm' }).fill('da')
    await page.getByRole('option', { name: 'Chăm sóc da' }).click()
    if (width < 768) await dialog.getByLabel('Giờ đến (không bắt buộc)').and(page.locator('select')).selectOption('09:00')
    else {
      await dialog.locator('.booking-time-field .mobile-select-trigger').click()
      await page.getByRole('listbox', { name: 'Giờ đến (không bắt buộc)' }).getByRole('option', { name: '09:00', exact: true }).click()
    }
    await dialog.getByRole('button', { name: 'Lưu lịch đặt' }).click()
    await expect.poll(() => saved?.customer_id).toBe(8)
    expect(saved.product_id).toBe(9); expect(saved.arrival_time).toBe('09:00'); expect(saved.branch_id).toBe(1)
    await expect(dialog).toHaveCount(0)
    await page.getByRole('button', { name: 'Sửa lịch Khách bảy giờ' }).click()
    await page.getByLabel('Ghi chú cho nhân viên').fill('Đã gọi xác nhận')
    await page.getByRole('button', { name: 'Lưu lịch đặt' }).click()
    await expect.poll(() => updated?.note).toBe('Đã gọi xác nhận')
    expect(updated.consultation_total).toBe('150000')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Xóa lịch Khách bảy giờ' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa lịch', exact: true }).click()
    await expect.poll(() => deleted).toBe(true)
  })
}