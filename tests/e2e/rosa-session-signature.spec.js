import { test, expect } from './fixtures'

for (const width of [1440, 390]) {
  test(`ghi chú, ký lại, cảnh báo bỏ ký và phục hồi lỗi ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF' } })))
    const writes = []
    let fail = true
    const customer = { id: 17, fullname: 'Khách Rosa', phone_number: '0901234567' }
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/treatments/execute') {
        writes.push(route.request().postDataJSON())
        return route.fulfill({ status: fail ? 400 : 201, json: fail ? { message: 'Lỗi thử nghiệm' } : { treatmentHistoryId: 99 } })
      }
      if (path === '/api/customers') return route.fulfill({ json: { data: [customer], total: 1 } })
      if (path.endsWith('/overview')) return route.fulfill({ json: { data: { customer, timeline: [{ type: 'treatment', date: '2026-10-28', treatment: { id: 36, product_name: 'Chăm sóc da', remaining_sessions: 2, total_sessions: 5, histories: [] } }] } } })
      if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'KTV' }] } })
      if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên A', role_id: 1, branch_id: 1 }] } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/customers')
    await page.getByRole('button', { name: 'Xem Khách Rosa' }).click()
    await page.getByRole('checkbox', { name: 'Làm hôm nay' }).check()
    await page.getByRole('textbox', { name: /Ghi chú buổi thực hiện/ }).fill('  Da nhạy cảm\nTheo dõi thêm  ')
    const layout = await page.locator('.customer-session-fields').evaluate(element => {
      const [left, right] = [...element.children].map(child => child.getBoundingClientRect())
      return { ratio: left.width / element.getBoundingClientRect().width, stacked: right.top >= left.bottom, fits: element.getBoundingClientRect().right <= innerWidth && document.documentElement.scrollWidth <= innerWidth }
    })
    expect(layout.fits).toBe(true)
    if (width > 600) { expect(layout.ratio).toBeGreaterThan(0.4); expect(layout.ratio).toBeLessThan(0.55) }
    else expect(layout.stacked).toBe(true)
    const submit = page.getByRole('button', { name: 'Xác nhận hôm nay' })
    const note = page.getByRole('textbox', { name: /Ghi chú buổi thực hiện/ })
    await note.focus()
    const noteStyle = await note.evaluate(element => {
      const style = getComputedStyle(element)
      return { radius: style.borderRadius, outline: style.outlineStyle, shadow: style.boxShadow, fontSize: style.fontSize }
    })
    expect(noteStyle.radius).toBe('14px')
    expect(noteStyle.outline).toBe('none')
    expect(noteStyle.shadow).not.toBe('none')
    if (width === 390) expect(noteStyle.fontSize).toBe('16px')
    await submit.click()
    expect(writes).toHaveLength(0)
    await page.getByRole('button', { name: 'Quay lại ký' }).click()
    await expect(page.getByRole('textbox', { name: /Ghi chú buổi thực hiện/ })).toHaveValue('  Da nhạy cảm\nTheo dõi thêm  ')
    const pad = page.getByRole('img', { name: 'Vùng ký tên khách hàng' })
    const draw = async () => {
      await pad.scrollIntoViewIfNeeded()
      const box = await pad.boundingBox()
      if (width > 600) {
        await page.mouse.move(box.x + 10, box.y + 20)
        await page.mouse.down()
        await page.mouse.move(box.x + 80, box.y + 60, { steps: 8 })
        await page.mouse.up()
      } else {
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 10, y: box.y + 20 }] })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 80, y: box.y + 60 }] })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await cdp.detach()
      }
    }
    await draw()
    await expect(pad.locator('path')).toHaveCount(1)
    await page.getByRole('button', { name: 'Xóa chữ ký / Ký lại' }).click()
    await expect(pad.locator('path')).toHaveCount(0)
    await submit.click()
    await page.getByRole('button', { name: 'Ghi nhận không có chữ ký' }).click()
    await expect(page.getByRole('alert')).toContainText('Lỗi thử nghiệm')
    expect(writes[0]).toEqual({ treatment_id: 36, staffs: [], note: 'Da nhạy cảm\nTheo dõi thêm' })
    await draw()
    fail = false
    await submit.click()
    await expect(page.getByText('Đã ghi nhận một buổi thực hiện.')).toBeVisible()
    expect(writes).toHaveLength(2)
    expect(writes[1].customer_signature_svg).toMatch(/^<svg.*<path d="M .* L /)
    expect(writes[1]).not.toHaveProperty('customer_signed_at')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })
}