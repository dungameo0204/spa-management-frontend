import { test, expect } from './fixtures'
import { today } from '../../src/utils/format'

for (const mobile of [false, true]) {
  test(`ghi chú sau ký và ký bổ sung đúng buổi, không tạo execution - ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    const writes = [], day = today()
    const svg = '<svg viewBox="0 0 600 180"><path d="M 10 10 L 100 80"/></svg>'
    const histories = [
      { id: 77, branch_id: 1, execution_date: day, created_at: '2020-01-01', note: 'Đã ký vẫn sửa', customer_signature_svg: svg, customer_signed_at: `${day} 09:00:00` },
      { id: 78, branch_id: 1, execution_date: day, created_at: '2020-01-01', note: null },
    ]
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname, method = route.request().method()
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'followup-test', user: { id: 1, system_role: 'STAFF', branch_id: 1, fullname: 'Nhân viên' } } } })
      if (method !== 'GET') {
        const body = route.request().postDataJSON()
        writes.push({ path, method, body })
        const match = path.match(/^\/api\/treatments\/execute\/(77|78)\/(note|sign)$/)
        if (match) {
          const history = histories.find(item => item.id === Number(match[1]))
          if (match[2] === 'note') history.note = body.note
          else { history.customer_signature_svg = body.customer_signature_svg; history.customer_signed_at = `${day} 10:00:00` }
          return route.fulfill({ json: { data: history } })
        }
      }
      if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, branch_id: 1, created_at: '2020-01-01', customer_name: 'Khách Followup', product_name: 'Da', remaining_sessions: 2, total_sessions: 5 }], total: 1 } })
      if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories } } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/login')
    await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
    await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page.getByRole('heading', { name: 'Khách hàng hôm nay' })).toBeVisible()
    const firstRow = page.locator('tr[data-history-id="77"]'), secondRow = page.locator('tr[data-history-id="78"]')
    await expect(firstRow).toHaveCount(1)
    await expect(secondRow).toHaveCount(1)
    await expect(firstRow.getByRole('img', { name: 'Chữ ký buổi #77' })).toBeVisible()
    await expect(secondRow.getByRole('img')).toHaveCount(0)
    const layout = await firstRow.locator('.today-session-signatures').evaluate(element => {
      const preview = element.querySelector('.today-signature-preview').getBoundingClientRect(), button = element.querySelector('button').getBoundingClientRect()
      return { beside: button.left >= preview.right, height: element.getBoundingClientRect().height, contained: element.getBoundingClientRect().right <= innerWidth }
    })
    expect(layout.beside).toBe(true)
    expect(layout.height).toBeLessThan(140)
    expect(layout.contained).toBe(true)
    await page.getByRole('button', { name: 'Ghi chú và chữ ký #77 - Khách Followup' }).click()
    let dialog = page.getByRole('dialog', { name: 'Ghi chú và chữ ký' })
    await expect(dialog.getByRole('button', { name: 'Lưu và ký xác nhận' })).toHaveCount(0)
    await dialog.getByRole('textbox').fill('Ghi chú sau ký')
    await dialog.getByRole('button', { name: 'Lưu ghi chú' }).click()
    await expect(dialog.getByRole('status')).toHaveText('Đã lưu ghi chú.')
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click()
    await page.getByRole('button', { name: 'Ghi chú và chữ ký #78 - Khách Followup' }).click()
    dialog = page.getByRole('dialog', { name: 'Ghi chú và chữ ký' })
    await dialog.getByRole('textbox').fill('Ghi chú trước ký')
    await dialog.getByRole('button', { name: 'Khách hàng ký tên' }).click()
    const pad = page.getByRole('img', { name: 'Vùng ký tên khách hàng' })
    await pad.scrollIntoViewIfNeeded()
    const box = await pad.boundingBox()
    if (mobile) {
      await pad.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', button: 0, clientX: box.x + 10, clientY: box.y + 20 })
      await pad.dispatchEvent('pointermove', { pointerId: 1, pointerType: 'touch', clientX: box.x + 90, clientY: box.y + 65 })
      await pad.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' })
    } else {
      await page.mouse.move(box.x + 10, box.y + 20); await page.mouse.down()
      await page.mouse.move(box.x + 90, box.y + 65, { steps: 8 }); await page.mouse.up()
    }
    await page.getByRole('button', { name: 'Dùng chữ ký này' }).click()
    await dialog.getByRole('button', { name: 'Lưu và ký xác nhận' }).click()
    await expect(dialog.getByRole('status')).toHaveText('Đã ký xác nhận buổi.')
    await expect(dialog.getByRole('img', { name: 'Chữ ký khách hàng xác nhận buổi thực hiện' })).toBeVisible()
    await dialog.getByRole('textbox').fill('   ')
    await dialog.getByRole('button', { name: 'Lưu ghi chú' }).click()
    await expect(dialog.getByRole('status')).toHaveText('Đã lưu ghi chú.')
    expect(writes.map(({ path, method }) => ({ path, method }))).toEqual([
      { path: '/api/treatments/execute/77/note', method: 'PUT' },
      { path: '/api/treatments/execute/78/note', method: 'PUT' },
      { path: '/api/treatments/execute/78/sign', method: 'POST' },
      { path: '/api/treatments/execute/78/note', method: 'PUT' },
    ])
    expect(writes[3].body).toEqual({ note: null })
    expect(writes[2].body).toEqual({ customer_signature_svg: expect.stringContaining('<svg') })
    expect(await dialog.evaluate(element => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth && element.scrollWidth <= element.clientWidth })).toBe(true)
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Chữ ký buổi #78' })).toBeVisible()
  })
}