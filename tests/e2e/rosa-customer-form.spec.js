import { test, expect } from './fixtures'

for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  test(`Rosa customer create/edit at ${viewport.width}px`, async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.setViewportSize(viewport)
    await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'MANAGER' } })))
    let customer = { id: 3, fullname: 'Lan', phone_number: '0901234567', skin_types: null, referral_sources: null }
    const writes = []
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (['POST', 'PUT'].includes(route.request().method())) {
        const body = route.request().postDataJSON()
        writes.push(body)
        customer = { ...customer, ...body }
        return route.fulfill({ json: { message: 'OK', customerId: 3 } })
      }
      if (path === '/api/customers') return route.fulfill({ json: { data: [customer], total: 1, totalPages: 1 } })
      if (path === '/api/customers/3/overview') return route.fulfill({ json: { data: { customer, timeline: [] } } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/customers')
    await expect.poll(() => pageErrors).toEqual([])
    await page.getByRole('button', { name: 'Thêm mới' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Họ tên', { exact: true }).fill('Lan')
    await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0901234567')
    expect(await dialog.getByLabel('Họ tên', { exact: true }).evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(44)
    await dialog.getByLabel('Mã hồ sơ').fill('ROSA-3')
    await dialog.getByLabel('Ngày lập hồ sơ').fill('2026-10-27')
    await dialog.getByLabel('Da khô', { exact: true }).check()
    await dialog.getByLabel('Da lão hóa').check()
    await dialog.getByLabel('Facebook').check()
    await dialog.locator('summary').click()
    await dialog.getByLabel('Tiền sử da trong gia đình').fill('Không có')
    await dialog.getByLabel('Nội dung tư vấn').fill('Phục hồi da\nChống nắng')
    await expect(dialog).toBeVisible()
    const layout = await dialog.evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth, grid: getComputedStyle(element.querySelector('.customer-form-grid')).gridTemplateColumns }))
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1)
    expect(layout.grid.split(' ')).toHaveLength(viewport.width > 600 ? 2 : 1)
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect.poll(() => writes.length).toBe(1)
    expect(writes[0]).toMatchObject({ profile_code: 'ROSA-3', skin_types: ['DRY', 'AGING'], referral_sources: ['FACEBOOK'], family_skin_history: 'Không có', consultation_note: 'Phục hồi da\nChống nắng' })
    await page.getByRole('button', { name: 'Xem Lan' }).click()
    await page.getByRole('button', { name: 'Sửa', exact: true }).click()
    await expect(dialog.getByLabel('Mã hồ sơ')).toHaveValue('ROSA-3')
    await expect(dialog.getByLabel('Da khô', { exact: true })).toBeChecked()
    await expect(dialog.getByLabel('Da lão hóa')).toBeChecked()
    await dialog.getByRole('group', { name: 'Loại da', exact: true }).getByRole('button', { name: 'Bỏ chọn tất cả' }).click()
    await dialog.getByLabel('Nội dung tư vấn').fill('')
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect.poll(() => writes.length).toBe(2)
    expect(writes[1]).toEqual({ skin_types: [], consultation_note: null })
  })
}