import { test, expect } from './fixtures'

test('lịch sử khách hiển thị một dòng dịch vụ kèm liệu trình và thông báo thành công màu xanh', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF', fullname: 'Nhân viên' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/customers/17/overview') return route.fulfill({ json: { data: {
      customer: { id: 17, fullname: 'Khách thử', phone_number: '0900000000', wallet_balance: '0', total_debt: '0' },
      timeline: [{ type: 'purchase', date: '2026-10-10T03:05:17.000Z', item: {
        invoice_item_id: 57, invoice_id: 49, product_name: 'tẩy nốt ruồi', quantity: 5,
        is_product: 0, unit_price: '50000.00', final_price: '250000.00',
         treatment: { id: 36, product_name: 'tẩy nốt ruồi', remaining_sessions: 1, total_sessions: 2, branch_id: 1, histories: [{ id: 27, execution_date: '2026-10-10T03:08:13.000Z', branch_id: 2, branch_name: 'Cơ sở Hai', staffs: [{ staff_name: 'Kỹ thuật viên' }] }, { id: 28, execution_date: '2026-10-09T03:08:13.000Z', branch_id: 3, staffs: [] }] },
      } }],
    } } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 17, fullname: 'Khách thử', phone_number: '0900000000' }], total: 1 } })
    if (path === '/api/treatments/execute') return route.fulfill({ status: 201, json: { treatmentHistoryId: 99 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/customers')
  await page.getByText('Khách thử').first().click()
  const timeline = page.locator('.customer-overview .timeline-row')
  await expect(timeline).toHaveCount(1)
  await expect(timeline.first()).toContainText('Hóa đơn #49')
  await expect(timeline.first()).toContainText('còn 1/2 buổi')
  await expect(page.getByRole('heading', { name: 'Lịch sử mua và chăm sóc' })).toBeVisible()
  await page.getByRole('button', { name: /Xem lịch sử/ }).click()
  await expect(timeline.first()).toContainText('Kỹ thuật viên')
   await expect(timeline.first().locator('.treatment-history p').first()).toContainText('Cơ sở thực hiện: Cơ sở Hai')
   await expect(timeline.first().locator('.treatment-history p').nth(1)).toContainText('Cơ sở thực hiện: Cơ sở #3')
  const controls = await page.locator('.treatment-control-bar').evaluate(bar => {
    const action = bar.querySelector('button').getBoundingClientRect()
    const checkbox = bar.querySelector('label').getBoundingClientRect()
    return { sameRow: Math.abs(checkbox.top - action.top) < 10, insideBar: checkbox.right <= bar.getBoundingClientRect().right, ordered: checkbox.top >= action.top }
  })
  expect(controls.ordered).toBe(true)
  expect(controls.insideBar).toBe(true)
  await page.getByRole('checkbox', { name: 'Làm hôm nay' }).check()
  await expect(page.getByText('Đang chuẩn bị ghi nhận thêm 1 buổi hôm nay. Kiểm tra lại lịch sử trước khi xác nhận.')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Đang chọn ghi nhận hôm nay' }).locator('..')).toHaveClass(/is-selected/)
  await page.getByRole('button', { name: 'Xác nhận hôm nay' }).click()
  await expect(page.getByText('Đã ghi nhận một buổi thực hiện.')).toHaveClass(/success-alert/)
})

test('tick Làm hôm nay thẳng cột khi dòng khác có nhãn đã thực hiện', async ({ page }) => {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF', fullname: 'Nhân viên' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/customers/17/overview') return route.fulfill({ json: { data: {
      customer: { id: 17, fullname: 'Khách thử', phone_number: '0900000000', wallet_balance: '0', total_debt: '0' },
      timeline: [
        { type: 'purchase', date: today, item: { invoice_item_id: 57, invoice_id: 49, product_name: 'Liệu trình phun môi', quantity: 1, is_product: 0, unit_price: 20000000, final_price: 20000000, treatment: { id: 36, remaining_sessions: 10, total_sessions: 10, histories: [] } } },
        { type: 'purchase', date: today, item: { invoice_item_id: 58, invoice_id: 50, product_name: 'Massage', quantity: 10, is_product: 0, unit_price: 500000, final_price: 5000000, treatment: { id: 37, remaining_sessions: 9, total_sessions: 100, histories: [{ id: 27, execution_date: today }] } } },
      ],
    } } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 17, fullname: 'Khách thử', phone_number: '0900000000' }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/customers')
  await page.getByText('Khách thử').first().click()
  const bars = page.locator('.customer-overview .treatment-control-bar')
  await expect(bars).toHaveCount(2)
  await expect(bars.nth(1).locator('.today-execution-badge')).toBeVisible()
  const positions = await bars.evaluateAll(elements => elements.map(bar => {
    const checkbox = bar.querySelector('.choice-row').getBoundingClientRect()
    return { left: checkbox.left, top: checkbox.top, barRight: bar.getBoundingClientRect().right }
  }))
  expect(Math.abs(positions[0].left - positions[1].left)).toBeLessThan(2)
  expect(positions.every(position => position.left < position.barRight)).toBe(true)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(bars.locator('.choice-row')).toHaveCount(2)
  const mobile = await bars.evaluateAll(elements => elements.map(bar => {
    const checkbox = bar.querySelector('.choice-row').getBoundingClientRect()
    const info = bar.querySelector('.treatment-control-info').getBoundingClientRect()
    return { belowInfo: checkbox.top >= info.bottom, fits: checkbox.right <= bar.getBoundingClientRect().right }
  }))
  expect(mobile.every(position => position.belowInfo && position.fits)).toBe(true)
})

test('chi tiết khách giữ cơ sở, bốn vai trò và xác nhận trong panel responsive', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'MANAGER', fullname: 'Quản lý' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/customers/17/overview') return route.fulfill({ json: { data: {
      customer: { id: 17, fullname: 'Khách thử', phone_number: '0900000000', wallet_balance: 0, total_debt: 0 },
      timeline: [{ type: 'treatment', date: '2026-10-10', treatment: { id: 36, product_name: 'Chăm sóc da', remaining_sessions: 2, total_sessions: 5, histories: [] } }],
    } } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 17, fullname: 'Khách thử', phone_number: '0900000000' }], total: 1 } })
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }], total: 1 } })
    if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'KTV mặt' }, { id: 2, name: 'KTV body' }, { id: 3, name: 'KTV' }, { id: 4, name: 'BS' }], total: 4 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [1, 2, 3, 4].map(id => ({ id, fullname: `Nhân viên ${id}`, branch_id: 1, role_id: id })), total: 4 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/customers')
  await page.getByText('Khách thử').first().click()
  await page.getByRole('checkbox', { name: 'Làm hôm nay' }).check()
  await page.getByRole('combobox', { name: 'Cơ sở thực hiện' }).selectOption('1')
  const row = page.locator('.customer-inline-actions')
  await expect(row.locator('.role-staff-picker select')).toHaveCount(4)
  const layout = await row.evaluate(element => {
    const selects = [...element.querySelectorAll('select')].map(select => select.getBoundingClientRect())
    const button = element.querySelector('button').getBoundingClientRect()
    return { sameLine: selects.every(select => Math.abs(select.top - selects[0].top) < 3) && Math.abs(button.bottom - selects[0].bottom) < 3, fits: button.right <= element.getBoundingClientRect().right && selects.every(select => select.right <= element.getBoundingClientRect().right) }
  })
  expect(layout.fits).toBe(true)
  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await row.locator('.role-staff-picker').evaluate(element => {
    const fields = [...element.querySelectorAll('.field')].map(field => field.getBoundingClientRect())
    const controls = [...element.querySelectorAll('.mobile-select-trigger')].map(trigger => trigger.getBoundingClientRect())
    return { twoColumns: Math.abs(fields[0].top - fields[1].top) < 2 && fields[2].top >= fields[0].bottom,
      fullWidth: controls.every((box, index) => Math.abs(box.width - fields[index].width) < 2 && box.height === 40),
      fits: fields.every(box => box.right <= innerWidth) && document.documentElement.scrollWidth <= innerWidth }
  })
  expect(mobile).toEqual({ twoColumns: true, fullWidth: true, fits: true })
})