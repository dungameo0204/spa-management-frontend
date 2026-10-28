import { test, expect } from './fixtures'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')

test('album errors remain inline, drafts survive and deleting the last session goes back a page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF' } })))
  const customer = { id: 17, fullname: 'Khách phục hồi', phone_number: '0901234567' }
  let deleted = false, rejectDelete = true
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path.includes('/skin-image-sessions')) {
      if (request.method() === 'DELETE') {
        if (rejectDelete) { rejectDelete = false; return route.fulfill({ status: 500, json: { message: 'Không xóa được lần chụp' } }) }
        deleted = true
      }
      if (request.method() === 'PUT') return route.fulfill({ status: 500, json: { message: 'Không lưu được ghi chú' } })
      const second = url.searchParams.get('page') === '2'
      return route.fulfill({ json: { data: second && deleted ? [] : [{ id: second ? 2 : 1, captured_date: '2026-10-27', note: second ? 'Trang hai' : 'Trang một', images: [] }], total: deleted ? 1 : 11, totalPages: deleted ? 1 : 2 } })
    }
    if (path === '/api/customers') return route.fulfill({ json: { data: [customer], total: 1 } })
    if (path.endsWith('/overview')) return route.fulfill({ json: { data: { customer, timeline: [] } } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/customers')
  await page.getByRole('button', { name: 'Xem Khách phục hồi' }).click()
  const album = page.getByRole('region', { name: 'Album ảnh da' })
  await album.getByRole('button', { name: 'Thêm lần chụp' }).click()
  await album.getByLabel('Chọn ảnh', { exact: true }).setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') })
  await expect(album.locator('.skin-editor').getByRole('alert')).toContainText('JPEG')
  await album.getByLabel('Chọn ảnh', { exact: true }).setInputFiles({ name: 'valid.png', mimeType: 'image/png', buffer: png })
  await expect(album.locator('.skin-editor').getByRole('alert')).toHaveCount(0)
  await album.getByRole('button', { name: 'Hủy nhập ảnh' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await album.getByRole('button', { name: 'Sửa lần chụp', exact: true }).click()
  await album.getByLabel('Ghi chú lần chụp').fill('Nội dung chưa lưu')
  await album.getByRole('button', { name: 'Lưu album' }).click()
  await expect(album.locator('.skin-editor').getByRole('alert')).toContainText('Không lưu được ghi chú')
  await expect(album.getByLabel('Ghi chú lần chụp')).toHaveValue('Nội dung chưa lưu')
  await album.getByRole('button', { name: 'Hủy nhập ảnh' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await album.getByRole('button', { name: 'Sau', exact: true }).click()
  await expect(album).toContainText('Trang hai')
  await album.getByRole('button', { name: 'Xóa lần chụp', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Không xóa được lần chụp')
  await expect(album.getByRole('alert')).toHaveCount(0)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(album).toContainText('Trang một')
  await expect(album.getByRole('navigation', { name: 'Phân trang album' })).toHaveCount(0)
})