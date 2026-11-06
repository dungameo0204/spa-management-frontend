import { test, expect } from './fixtures'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => console.log(`PAGE_ERROR: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') console.log(`CONSOLE_ERROR: ${message.text()}`) })
  await page.addInitScript(() => {
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'MANAGER', fullname: 'Quản lý' } }))
    window.print = () => { window.__customerRecordPrinted = true }
  })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    const customer = { id: 17, profile_code: 'HS-017', profile_date: '2026-11-05', fullname: 'Khách hồ sơ', phone_number: '0900000000', date_of_birth: '1995-08-21', gender: 'FEMALE', address: 'Hà Nội', skin_types: ['DRY'], referral_sources: ['FACEBOOK'], previous_skin_treatments: '', skin_assessment: 'Da khô', consultation_note: 'Dưỡng ẩm', wallet_balance: 0, total_debt: 500000 }
    const treatment = { id: 36, customer_id: 17, product_name: 'Chữa nám trọn đời', total_sessions: null, children: [{ id: 37, product_name: 'PRP', total_sessions: null, histories: [{ id: 98, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV A' }] }] }, { id: 38, product_name: 'Laser', total_sessions: 10, histories: [{ id: 99, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV A' }], customer_signature_svg: '<svg viewBox="0 0 10 10"><path d="M 0 0 L 10 10" /></svg>' }, { id: 101, execution_date: '2026-11-05', staffs: [{ staff_name: 'KTV A' }] }] }, { id: 39, product_name: 'Massage', total_sessions: null, histories: [{ id: 100, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV B' }], customer_signature_svg: '<svg viewBox="0 10 10 0"><path d="M 0 10 L 10 0" /></svg>' }] }] }
    const timeline = [{ type: 'purchase', date: '2026-11-03', item: { invoice_item_id: 42, invoice_id: 9, is_product: 0, product_name: 'Chữa nám trọn đời', quantity: 1, unit_price: 30000000, final_price: 30000000, treatment } }]
    const data = path === '/api/customers' ? [customer] : path === '/api/customers/17/overview' ? { customer, timeline } : path === '/api/treatments' || path === '/api/treatments/36' ? path === '/api/treatments' ? [treatment] : treatment : []
    return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1, totalPages: 1 } })
  })
})

test('in hồ sơ khách tạo đủ bìa, khai thác tiền sử và phiếu điều trị A4', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 950 })
  await page.goto('/customers')
  await page.screenshot({ path: 'test-results/customer-record-list.png', fullPage: true })
  await page.getByRole('button', { name: 'Xem Khách hồ sơ', exact: true }).click()
  await page.getByRole('button', { name: 'In hồ sơ' }).click()
  await expect(page.locator('#customer-record-print')).toBeAttached()
  await expect(page.locator('#customer-record-print')).toContainText('HỒ SƠ KHÁCH HÀNG')
  await expect(page.locator('#customer-record-print')).not.toContainText('LOẠI DA CỦA KHÁCH HÀNG')
  await expect(page.locator('.customer-record-cover .customer-record-history')).toContainText('KHAI THÁC TIỀN SỬ')
  await expect(page.locator('#customer-record-print')).toContainText('PHIẾU THEO DÕI ĐIỀU TRỊ')
  await expect(page.locator('#customer-record-print')).toContainText('PRP, Laser (lần 1), Massage')
  await expect(page.locator('#customer-record-print')).toContainText('Chữa nám trọn đời × 1')
  await expect(page.locator('#customer-record-print')).toContainText('Ngày mua: 03/11/2026')
  await expect(page.locator('#customer-record-print')).toContainText('Laser × 10 buổi')
  await expect(page.locator('.customer-record-treatment-table')).toContainText('Số lần')
  await expect(page.locator('.customer-record-treatment-table')).not.toContainText('KTV')
  await expect(page.locator('.customer-record-treatment-table tbody tr').nth(0)).toContainText('1')
  await expect(page.locator('.customer-record-treatment-table tbody tr').nth(1)).toContainText('2')
  await expect(page.locator('.customer-record-signature-image')).toHaveCount(1)
  await expect.poll(() => page.evaluate(() => window.__customerRecordPrinted)).toBe(true)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.customer-record-page')).toHaveCount(3)
  await page.screenshot({ path: 'test-results/customer-record-print.png', fullPage: true })
})

test('chia sẻ tạo PNG thật với theme OKLCH, không lóe hồ sơ hoặc gọi in', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    window.__shareInViewport = false
    window.__shareObserved = false
    const inspect = () => {
      const root = document.querySelector('#customer-record-share')
      if (root) {
        window.__shareObserved = true
        const bounds = root.getBoundingClientRect()
        if (bounds.right > 0 && bounds.left < innerWidth && bounds.bottom > 0 && bounds.top < innerHeight) window.__shareInViewport = true
      }
    }
    new MutationObserver(inspect).observe(document, { childList: true, subtree: true })
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const downloads = []
  page.on('download', download => downloads.push(download))
  await page.goto('/customers')
  await page.getByRole('button', { name: 'Xem Khách hồ sơ', exact: true }).click()
  await page.addStyleTag({ content: 'html,body{background:oklch(95% .03 250);color:oklch(25% .05 250)}' })
  await page.getByRole('button', { name: 'Chia sẻ', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Chia sẻ hồ sơ khách hàng' })
  await expect(dialog).toBeVisible({ timeout: 30000 })
  await expect(dialog.locator('img')).toHaveCount(3)
  expect(downloads).toHaveLength(0)
  await dialog.getByRole('button', { name: 'Tải tất cả ảnh' }).click()
  await expect.poll(() => downloads.length).toBe(3)
  for (const [index, download] of downloads.entries()) {
    expect(download.suggestedFilename()).toBe(`ho-so-khach-ho-so-trang-${index + 1}.png`)
    const png = await readFile(await download.path())
    const image = sharp(png)
    const metadata = await image.metadata()
    expect(metadata.format).toBe('png')
    expect(metadata.width).toBeGreaterThanOrEqual(1587)
    expect(metadata.height).toBeGreaterThanOrEqual(2245)
    const stats = await image.stats()
    expect(stats.channels.some(channel => channel.stdev > 5)).toBe(true)
  }
  expect(await page.evaluate(() => window.__shareObserved)).toBe(true)
  expect(await page.evaluate(() => window.__shareInViewport)).toBe(false)
  expect(await page.evaluate(() => window.__customerRecordPrinted)).not.toBe(true)
  await expect(page.locator('#customer-record-share')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Chia sẻ', exact: true })).toBeEnabled()
  expect(errors).toEqual([])
})

test('PNG giữ đủ hai đầu chữ ký SVG có viewBox lệch và không có kích thước', async ({ page }) => {
  await page.route('**/api/treatments/36', route => route.fulfill({ json: { data: {
    id: 36, total_sessions: 10, product_name: 'Kiểm tra chữ ký', histories: [{
      id: 1, execution_date: '2026-11-05',
      customer_signature_svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 40 400 80" fill="none" stroke-width="6"><path stroke="black" d="M 110 100 L 180 50 L 260 100 L 340 50 L 410 100 L 490 50"/><path stroke="red" d="M 110 50 L 110 100"/><path stroke="blue" d="M 490 50 L 490 100"/></svg>',
    }],
  } } }))
  await page.goto('/customers')
  await page.getByRole('button', { name: 'Xem Khách hồ sơ', exact: true }).click()
  await page.getByRole('button', { name: 'Chia sẻ', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Chia sẻ hồ sơ khách hàng' })
  await expect(dialog).toBeVisible({ timeout: 30000 })
  const downloaded = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Tải trang 3', exact: true }).click()
  const png = await readFile(await (await downloaded).path())
  const { data } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let red = 0, blue = 0
  for (let i = 0; i < data.length; i += 3) {
    if (data[i] > 180 && data[i + 1] < 80 && data[i + 2] < 80) red++
    if (data[i] < 80 && data[i + 1] < 80 && data[i + 2] > 180) blue++
  }
  expect(red).toBeGreaterThan(30)
  expect(blue).toBeGreaterThan(30)
  await page.screenshot({ path: 'test-results/customer-record-share-preview.png', fullPage: true })
})