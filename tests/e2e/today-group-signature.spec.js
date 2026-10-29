import { test, expect } from './fixtures'

test('parent signs once for performed children; pending children have no signature action', async ({ page }) => {
  const signatures = []
  const notes = []
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const children = [
    { id: 11, product_name: 'pnp', remaining_sessions: null, histories: [{ id: 101, execution_date: day, branch_id: 1, staffs: [{ staff_name: 'Lan' }] }] },
    { id: 12, product_name: 'Tàn nhang', remaining_sessions: 2, histories: [{ id: 102, execution_date: day, branch_id: 1, staffs: [] }] },
    { id: 13, product_name: 'Massage', remaining_sessions: 3, histories: [] },
  ]
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Gói trị nám', created_at: '2020-01-01', branch_id: 1, children }
  const standalone = { id:20, customer_name:'Khách B', product_name:'pnp đơn lẻ', created_at:day, branch_id:1, remaining_sessions:5, histories:[{ id:201, execution_date:day, branch_id:1, staffs:[{ staff_name:'Lan' }] }] }
  const secondSession = { ...standalone, id:21, histories:[{ ...standalone.histories[0], id:202 }] }
  await page.addInitScript(() => { sessionStorage.setItem('xuly.branch', '1'); localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, system_role: 'MANAGER' } })) })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/treatments/10/note') {
      const body = route.request().postDataJSON()
      notes.push(body)
      root.note = body.note
      return route.fulfill({ json: { data: { id:10, note:body.note } } })
    }
    if (path === '/api/treatments') return route.fulfill({ json: { data: [standalone, secondSession, root], total: 3, totalPages: 1 } })
    if (path === '/api/treatments/21') return route.fulfill({ json:{ data:secondSession } })
    if (path === '/api/treatments/20') return route.fulfill({ json:{ data:standalone } })
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: root } })
    for (const child of children) if (path === `/api/treatments/${child.id}`) return route.fulfill({ json: { data: child } })
    if (/\/execute\/\d+\/sign$/.test(path)) {
      const id = Number(path.split('/').at(-2)), body = route.request().postDataJSON()
      signatures.push({ id, ...body })
      const history = children.flatMap(child => child.histories).find(history => history.id === id)
      Object.assign(history, body)
      return route.fulfill({ json: { data: history } })
    }
    return route.fulfill({ json: { data: [], total: 0, totalPages: 1 } })
  })
  await page.goto('/')
  const table = page.locator('.today-treatments')
  await expect(table.getByRole('button', { name: 'Ghi chú và chữ ký nhóm Gói trị nám' })).toBeVisible()
  await expect(table.locator('.today-treatment-child').getByRole('button', { name: /Ký/ })).toHaveCount(0)
  const groupButton = table.getByRole('button', { name:'Ghi chú và chữ ký nhóm Gói trị nám' })
  const standaloneButton = table.getByRole('button', { name:'Ghi chú và chữ ký #201 - Khách B' })
  await expect(groupButton.locator('svg')).toHaveCount(1)
  await expect(standaloneButton.locator('svg')).toHaveCount(1)
  const buttonStyle = locator => locator.evaluate(el => {
    const style = getComputedStyle(el)
    return [style.backgroundColor, style.color, style.borderRadius, style.padding, style.display, style.gap]
  })
  expect(await buttonStyle(groupButton)).toEqual(await buttonStyle(standaloneButton))
  const groupCell = table.locator('.today-treatment-group td').first()
  const standaloneCell = table.locator('.today-treatment-standalone td').first()
  expect(await standaloneCell.evaluate(el => getComputedStyle(el).backgroundColor)).toEqual(await groupCell.evaluate(el => getComputedStyle(el).backgroundColor))
  await expect(standaloneCell).toHaveCSS('font-weight', '700')
  for (const row of await table.locator('.today-treatment-standalone, .today-treatment-group').all()) {
    await expect(row.locator('td').first()).toHaveCSS('border-top-width', '2px')
    await expect(row.locator('td').first()).toHaveCSS('border-left-width', '3px')
  }
  await expect(table.locator('.today-treatment-child td').first()).toHaveCSS('border-top-width', '1px')
  await table.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/today-group-parent-signature.png' })
  await table.getByRole('button', { name: 'Ghi chú và chữ ký nhóm Gói trị nám' }).click()
  const dialog = page.getByRole('dialog', { name: 'Ghi chú và chữ ký nhóm dịch vụ' })
  await expect(dialog.getByRole('textbox')).toHaveCount(1)
  await dialog.getByRole('textbox').fill('làm lần 1')
  await dialog.getByRole('button', { name:'Lưu ghi chú', exact:true }).click()
  await expect(dialog.getByRole('status')).toContainText('Đã lưu ghi chú chung')
  expect(notes).toEqual([{ note:'làm lần 1' }])
  await dialog.getByRole('button', { name: 'Khách hàng ký tên' }).click()
  const box = await page.getByRole('img', { name: 'Vùng ký tên khách hàng' }).boundingBox()
  await page.mouse.move(box.x + 20, box.y + 20)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, box.y + 70, { steps: 8 })
  await page.mouse.up()
  await page.getByRole('button', { name: 'Dùng chữ ký này' }).click()
  await dialog.getByRole('button', { name: 'Lưu và ký xác nhận' }).click()
  await expect(dialog.getByRole('status')).toContainText('Đã ký xác nhận')
  expect(signatures.map(item => item.id)).toEqual([101, 102])
  expect(signatures[0].customer_signature_svg).toBe(signatures[1].customer_signature_svg)
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).click()
  await expect(table.locator('.today-treatment-group')).toContainText('Đã ký')
  await groupButton.click()
  await expect(page.getByRole('textbox', { name:'Ghi chú chung liệu trình' })).toHaveValue('làm lần 1')
  await expect(page.getByRole('textbox')).toHaveCount(1)
})