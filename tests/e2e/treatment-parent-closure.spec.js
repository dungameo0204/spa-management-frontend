import { test, expect } from './fixtures'

for (const mobile of [false, true]) {
  test(`treatment parent execution and mandatory signed closure (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    const executed = [], closed = []
    const root = { id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Gói trị nám', created_at: '2026-01-01', total_sessions: 10, remaining_sessions: 10, children: [
      { id: 11, parent_treatment_id: 10, product_name: 'Laser', total_sessions: 3, remaining_sessions: 2, histories: [] },
      { id: 12, parent_treatment_id: 10, product_name: 'Massage', total_sessions: null, remaining_sessions: null, histories: [] },
    ] }
    const lifetime = { id: 20, customer_id: 1, customer_name: 'Khách A', product_name: 'Chăm sóc trọn đời', created_at: '2026-01-01', total_sessions: null, remaining_sessions: null, histories: [] }
    const exhausted = { ...lifetime, id: 21, product_name: 'Thẻ hết buổi', total_sessions: 1, remaining_sessions: 0 }
    await page.addInitScript(() => { sessionStorage.setItem('xuly.branch', '1'); localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, system_role: 'MANAGER' } })) })
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/treatments') return route.fulfill({ json: { data: [root, lifetime, exhausted], total: 3, totalPages: 1 } })
      if (path === '/api/treatments/10/note') { root.note = route.request().postDataJSON().note; return route.fulfill({ json: { data: root } }) }
      if (path === '/api/treatments/execute') {
        const body = route.request().postDataJSON(); executed.push(body)
        const child = root.children.find(item => item.id === body.treatment_id)
        child.histories.push({ id: 100 + executed.length, branch_id: 1, execution_date: '2026-10-29', customer_signature_svg: body.customer_signature_svg, staffs: [{ staff_name: 'Lan' }] })
        if (child.remaining_sessions !== null) child.remaining_sessions--
        return route.fulfill({ json: { data: { historyId: 100 + executed.length } } })
      }
      if (path === '/api/treatments/10/close') {
        closed.push(route.request().postDataJSON())
        for (const card of [root, ...root.children]) Object.assign(card, { closed_at: '2026-10-29', remaining_sessions: 0, ...closed[0] })
        return route.fulfill({ json: { data: { treatmentId: 10 } } })
      }
      const card = [root, lifetime, exhausted, ...root.children].find(item => path === `/api/treatments/${item.id}`)
      if (card) return route.fulfill({ json: { data: card } })
      if (path === '/api/customers/1') return route.fulfill({ json: { data: { fullname: 'Khách A', total_debt: 0, phone_number: '0900000001' } } })
      if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở A' }], totalPages: 1 } })
      if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'Kỹ thuật viên' }], totalPages: 1 } })
      if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 7, role_id: 1, branch_id: 1, fullname: 'Lan' }], totalPages: 1 } })
      return route.fulfill({ json: { data: [], total: 0, totalPages: 1 } })
    })
    await page.goto('/treatments')
    await page.getByRole('button', { name: 'Khách A: 3 dịch vụ' }).click()
    await expect(page.getByRole('button', { name: /Chăm sóc trọn đời · Trọn đời/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Thẻ hết buổi.*chờ ký kết thúc/ })).toBeVisible()
    const panel = page.locator('.treatment-root-panel').filter({ has: page.getByRole('button', { name: /Gói trị nám · 2 liệu trình con/ }) })
    await panel.getByRole('button', { name: /Gói trị nám · 2 liệu trình con/ }).click()
    await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
    await panel.getByRole('checkbox', { name: 'Laser' }).check()
    await panel.getByRole('combobox', { name: 'Nhân viên Laser - Kỹ thuật viên' }).selectOption('7')
    await panel.getByRole('textbox').fill('Theo dõi da')
    async function sign(container) {
      await container.getByRole('button', { name: 'Khách hàng ký tên' }).click()
      const box = await page.getByRole('img', { name: 'Vùng ký tên khách hàng' }).boundingBox()
      await page.mouse.move(box.x + 25, box.y + 25); await page.mouse.down()
      await page.mouse.move(box.x + 110, box.y + 70, { steps: 8 }); await page.mouse.up()
      await page.getByRole('button', { name: 'Dùng chữ ký này' }).click()
    }
    await sign(panel)
    await panel.getByRole('button', { name: 'Xác nhận thực hiện' }).click()
    await expect(panel.getByRole('status')).toContainText('Đã ghi nhận 1 dịch vụ')
    expect(executed).toHaveLength(1)
    expect(executed[0].treatment_id).toBe(11)
    expect(executed[0].staffs).toEqual([{ staff_id: 7 }])
    expect(executed[0].note).toBeUndefined()
    expect(root.note).toBe('Theo dõi da')
    await panel.getByRole('button', { name: 'Đóng thực hiện' }).click()
    await panel.getByRole('button', { name: 'Ký kết thúc liệu trình' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ký kết thúc liệu trình', exact: true })
    await expect(dialog.getByRole('button', { name: 'Xác nhận kết thúc' })).toBeDisabled()
    await sign(dialog)
    await dialog.getByRole('button', { name: 'Xác nhận kết thúc' }).click()
    expect(closed).toHaveLength(0)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Quay lại' }).click()
    await dialog.getByRole('button', { name: 'Xác nhận kết thúc' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Kết thúc toàn bộ liệu trình' }).click()
    await expect(dialog).toHaveCount(0)
    expect(closed).toHaveLength(1)
    expect(closed[0].closure_signature_svg).toContain('<path')
    await page.getByRole('button', { name: 'Khách A: 1 đã hoàn thành' }).click()
    await expect(page.getByAltText('Chữ ký khách hàng kết thúc liệu trình')).toBeVisible()
    await expect(page.locator('.treatment-root-panel').getByRole('button', { name: 'Thực hiện', exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}