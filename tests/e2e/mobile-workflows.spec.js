import { test, expect } from './fixtures'

async function setup(page, { single = false, completedCount = 0, history = false, closable = false } = {}) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const child = { id: 11, customer_id: 1, customer_name: 'Khách mobile', product_name: 'Chăm sóc phục hồi chuyên sâu và điều trị da nhạy cảm', branch_id: 1, remaining_sessions: 5, total_sessions: 6, histories: [] }
  const card = { id: 10, customer_id: 1, customer_name: 'Khách mobile', product_name: 'Gói chăm sóc chuyên sâu dành cho khách hàng mobile', branch_id: 1, created_at: day, children: [child], histories: [] }
  if (single) Object.assign(card, { children: [], total_sessions: 10, remaining_sessions: 4 })
  if (closable) Object.assign(single ? card : child, { total_sessions: null, remaining_sessions: null })
  if (history) {
    const histories = [{ id: 50, execution_date: day, branch_id: 1, branch_name: 'Cơ sở chăm sóc và phục hồi da chuyên sâu', staffs: [], note: 'Theo dõi da' }]
    if (single) card.histories = histories
    else child.histories = histories
  }
  const completed = Array.from({ length: completedCount }, (_, index) => ({ ...child, id: 100 + index, remaining_sessions: 0 }))
  await page.addInitScript(() => {
    sessionStorage.setItem('xuly.branch', '1')
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, system_role: 'MANAGER' } }))
  })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    const customer = { id: 1, fullname: 'Khách mobile', phone_number: '0901234567', total_debt: 0, wallet_balance: 0 }
    const data = path === '/api/customers' ? [customer]
      : path === '/api/customers/1/overview' ? { customer, timeline: [{ type: 'treatment', date: day, treatment: card }] }
      : path === '/api/treatments' ? [card, ...completed]
      : path === '/api/treatments/10' ? card
        : path === '/api/treatments/11' ? child
          : path === '/api/branches' ? [{ id: 1, name: 'Cơ sở chính' }]
            : path === '/api/roles' ? [{ id: 4, name: 'Kỹ thuật viên' }]
              : path === '/api/staffs' ? [{ id: 2, fullname: 'Lan', role_id: 4, branch_id: 1 }]
                : []
    return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1, totalPages: 1 } })
  })
}

for (const width of [320, 360, 390, 430]) {
  test(`single note and signature share a row above confirmation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page, { single: true })
    await page.goto('/treatments')
    await page.locator('.treatment-service-badge').first().click()
    const panel = page.locator('.is-single-treatment').first()
    await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
    const form = panel.locator('.treatment-execution-form')
    const noteButton = form.getByRole('button', { name: 'Ghi chú', exact: true })
    const signature = form.getByRole('button', { name: 'Khách hàng ký tên', exact: true })
    const noteBox = await noteButton.boundingBox()
    const signatureBox = await signature.boundingBox()
    expect(Math.abs(noteBox.y + noteBox.height / 2 - signatureBox.y - signatureBox.height / 2)).toBeLessThan(2)
    await noteButton.click()
    const note = form.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' })
    await note.fill('Theo dõi da')
    const textareaBox = await note.boundingBox()
    const actionsBox = await form.locator('.treatment-execution-actions').boundingBox()
    expect(textareaBox.y + textareaBox.height).toBeLessThanOrEqual(actionsBox.y)
    await form.getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
    await expect(note).toBeHidden()
    await form.getByRole('button', { name: 'Ghi chú ✓', exact: true }).click()
    await expect(note).toHaveValue('Theo dõi da')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/single-note-signature-${width}.png`, fullPage: true })
  })
}

for (const width of [320, 360, 390, 430, 1280]) {
  for (const single of [false, true]) {
    test(`closable ${single ? 'single' : 'grouped'} actions fit ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await setup(page, { single, closable: true })
      await page.goto('/treatments')
      await page.locator('.treatment-service-badge').first().click()
      const panel = page.locator(`.treatment-root-panel.is-${single ? 'single' : 'grouped'}-treatment`).first()
      const buttons = panel.locator('.is-page-actions > button')
      await expect(buttons).toHaveCount(3)
      const geometry = await buttons.evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect()
        const style = getComputedStyle(node)
        return { x: rect.x, y: rect.y, right: rect.right, height: rect.height, fontSize: style.fontSize, fits: node.scrollWidth <= node.clientWidth + 1 }
      }))
      expect(geometry.every(box => Math.abs(box.y - geometry[0].y) < 2)).toBe(true)
      expect(geometry[0].right).toBeLessThanOrEqual(geometry[1].x)
      expect(geometry[1].right).toBeLessThanOrEqual(geometry[2].x)
      expect(geometry.every(box => box.fits)).toBe(true)
      if (!single && width < 768) {
        expect(geometry.every(box => box.height === 30 && box.fontSize === '11px')).toBe(true)
        expect(geometry[0].right - geometry[0].x).toBeLessThan(85)
      }
      await expect(panel.locator('.treatment-close-action')).toHaveText('Ký kết thúc liệu trình')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `test-results/closable-${single ? 'single' : 'grouped'}-${width}.png`, fullPage: true })
      await panel.getByRole('button', { name: 'Ký kết thúc liệu trình', exact: true }).click()
      await expect(page.getByRole('dialog', { name: 'Ký kết thúc liệu trình', exact: true })).toBeVisible()
    })
  }
}

test('desktop workflow geometry is unchanged by mobile overrides', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await setup(page)
  for (const path of ['/', '/treatments', '/customers']) {
    await page.goto(path)
    if (path === '/treatments') await page.getByRole('button', { name: /Khách mobile:.*dịch vụ/ }).click()
    if (path === '/customers') await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
    const selector = path === '/' ? '.today-treatments' : path === '/customers' ? '.customer-overview .treatment-root-panel' : '.treatment-root-panel'
    const panel = page.locator(selector).first()
    await expect(panel).toBeVisible()
    if (path !== '/') await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
    const geometry = () => panel.evaluate(element => [element, ...element.querySelectorAll('button, input, .treatment-execution-form')].map(node => {
      const { x, y, width, height } = node.getBoundingClientRect()
      return { x, y, width, height }
    }))
    const before = await geometry()
    const disabled = await page.evaluate(() => {
      const sheet = [...document.styleSheets].find(sheet => sheet.ownerNode?.dataset.viteDevId?.replaceAll('\\', '/').endsWith('/src/styles/mobile-workflows.css'))
      if (!sheet) return false
      sheet.disabled = true
      return true
    })
    expect(disabled).toBe(true)
    const after = await geometry()
    expect(after).toHaveLength(before.length)
    after.forEach((box, index) => {
      for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(box[key] - before[index][key])).toBeLessThan(1)
    })
    await page.evaluate(() => {
      for (const sheet of document.styleSheets) sheet.disabled = false
    })
  }
})

async function expectContained(locator) {
  await expect(locator).toBeVisible()
  const overflow = await locator.evaluate(el => {
    const bounds = el.getBoundingClientRect()
    return { fits: el.scrollWidth <= el.clientWidth + 1, outside: [...el.querySelectorAll('*')].filter(node => node.getBoundingClientRect().right > bounds.right + 1).map(node => ({ className: node.className, width: node.getBoundingClientRect().width })) }
  })
  expect(overflow.fits, JSON.stringify(overflow.outside)).toBe(true)
  const box = await locator.boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width).toBeLessThanOrEqual(await locator.page().evaluate(() => innerWidth + 1))
}

async function expectCompactSubmit(locator) {
  const box = await locator.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(38)
  expect(box.height).toBeLessThanOrEqual(40)
}

async function expectTwoColumns(locator) {
  const boxes = await locator.locator(':scope > .field').evaluateAll(fields => fields.map(field => {
    const { top, right, bottom, left } = field.getBoundingClientRect()
    return { top, right, bottom, left }
  }))
  expect(boxes).toHaveLength(2)
  expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(2)
  expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left)
}

async function auditExecution(page, panel, width, context) {
  const form = panel.locator('.treatment-execution-form')
  const staff = form.getByRole('button', { name: /^Nhân viên làm/ })
  await staff.click()
  const picker = page.getByRole('dialog', { name: /^Nhân viên làm/ })
  await picker.getByRole('checkbox', { name: 'Lan', exact: true }).check()
  await picker.getByRole('button', { name: 'Xong', exact: true }).click()
  await expect(staff).toContainText('Lan')
  const actions = form.locator('.treatment-execution-actions')
  const boxes = await actions.locator('button').evaluateAll(nodes => nodes.map(node => {
    const { left, right } = node.getBoundingClientRect()
    return { left, right }
  }))
  expect(boxes[1].left - boxes[0].right).toBeGreaterThanOrEqual(8)
  const submit = actions.getByRole('button', { name: 'Xác nhận', exact: true })
  await submit.scrollIntoViewIfNeeded()
  await submit.click({ trial: true })
  if (context === 'treatment') {
    const nav = await page.locator('.mobile-nav').boundingBox()
    const button = await submit.boundingBox()
    expect(button.y + button.height).toBeLessThanOrEqual(nav.y - 8)
  }
  await page.screenshot({ path: `test-results/mobile-${context}-actions-${width}.png` })
  await submit.click()
  const confirmation = page.getByRole('alertdialog', { name: 'Ghi nhận buổi chưa có chữ ký?' })
  await expect(confirmation).toBeVisible()
  await confirmation.getByRole('button', { name: 'Quay lại ký' }).click()
  await actions.getByRole('button', { name: 'Đóng', exact: true }).click()
  await expect(form).toHaveCount(0)
}

for (const width of [320, 360, 390, 430]) {
  for (const single of [true, false]) test(`history metadata stays readable (${single ? 'single' : 'grouped'}) at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page, { single, history: true })
    await page.goto('/customers')
    await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
    const panel = page.locator('.customer-overview .treatment-root-panel').first()
    const toggle = panel.getByRole('button', { name: 'Xem lịch sử', exact: true })
    if (await toggle.count()) await toggle.click()
    const history = panel.locator('.treatment-history')
    await expectContained(history)
    const heading = history.locator(single ? '.treatment-history-meta strong' : '.treatment-history-day-heading > strong').first()
    await expect(heading).toBeVisible()
    const geometry = await heading.evaluate(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(node).lineHeight) }))
    expect(geometry.width).toBeGreaterThan(120)
    expect(geometry.height).toBeLessThan(geometry.lineHeight * 5)
  })

  test(`single execution collapses without blank space at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page, { single: true })
    for (const path of ['/treatments', '/customers']) {
      await page.goto(path)
      if (path === '/treatments') await page.getByRole('button', { name: /Khách mobile:.*dịch vụ/ }).click()
      else await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
      const panel = page.locator('.treatment-root-panel').first()
      await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
      const form = panel.locator('.treatment-execution-form')
      await expectContained(form)
      const initial = await form.boundingBox()
      expect(initial.height).toBeLessThan(330)
      const staff = await form.locator('.treatment-single-staff').boundingBox()
      const note = form.getByRole('button', { name: 'Ghi chú', exact: true })
      expect((await note.boundingBox()).y - (staff.y + staff.height)).toBeLessThan(20)
      await note.click()
      await form.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' }).fill('Theo dõi sau buổi')
      await form.getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
      expect(Math.abs((await form.boundingBox()).height - initial.height)).toBeLessThan(2)
      await form.getByRole('button', { name: 'Khách hàng ký tên', exact: true }).click()
      await page.getByRole('dialog', { name: 'Chữ ký khách hàng', exact: true }).getByRole('button', { name: 'Đóng vùng ký', exact: true }).click()
      expect(Math.abs((await form.boundingBox()).height - initial.height)).toBeLessThan(2)
      await form.getByRole('button', { name: 'Xác nhận', exact: true }).click({ trial: true })
    }
  })

  test(`completed customer actions stay inside their cells at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page, { completedCount: 123 })
    await page.goto('/treatments')
    const row = page.locator('.treatment-customers tr.clickable').first()
    const completed = row.getByRole('button', { name: 'Khách mobile: 123 đã hoàn thành', exact: true })
    await expect(completed).toBeVisible()
    for (const button of [completed, row.locator('.treatment-service-badge')]) {
      const fits = await button.evaluate(node => {
        const box = node.getBoundingClientRect(), cell = node.closest('td').getBoundingClientRect()
        return box.left >= cell.left - 1 && box.right <= cell.right + 1 && node.scrollWidth <= node.clientWidth + 1
      })
      expect(fits).toBe(true)
    }
    await completed.click()
    await expect(page.locator('.treatment-expanded-row')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test(`today visit and execution controls fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page)
    await page.goto('/')
    const section = page.locator('.today-treatments')
    await expectContained(section.locator('.today-visit').first())
    await section.getByRole('checkbox', { name: /Đã làm Khách mobile/ }).check()
    await expectContained(section.locator('.today-staff-actions'))
    await expectCompactSubmit(section.getByRole('button', { name: 'Xác nhận', exact: true }))
    expect((await section.locator('.today-visit').first().boundingBox()).height).toBeLessThan(510)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/mobile-today-${width}.png`, fullPage: true })
  })

  test(`treatment card and embedded execution fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page)
    await page.goto('/treatments')
    await page.getByRole('button', { name: /Khách mobile:.*dịch vụ/ }).click()
    const panel = page.locator('.treatment-root-panel').first()
    await expectContained(panel)
    await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
    await expectContained(panel.locator('.treatment-execution-form'))
    await panel.locator('.treatment-child-label input').check()
    await expectContained(panel.locator('.treatment-child-execution-row'))
    await expectCompactSubmit(panel.getByRole('button', { name: 'Xác nhận', exact: true }))
    await expectTwoColumns(panel.locator('.treatment-execution-manager-row'))
    expect((await panel.locator('.treatment-execution-form').boundingBox()).height).toBeLessThan(380)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/mobile-treatment-${width}.png`, fullPage: true })
    await auditExecution(page, panel, width, 'treatment')
  })

  test(`customer overview uses compact embedded execution at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page)
    await page.goto('/customers')
    await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
    const overview = page.locator('.customer-overview')
    await expectContained(overview)
    const panel = overview.locator('.treatment-root-panel').first()
    await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
    await panel.locator('.treatment-child-label input').check()
    const form = panel.locator('.treatment-execution-form')
    await expectContained(form)
    if (width <= 340) {
      const fields = await form.locator('.treatment-execution-manager-row > .field').evaluateAll(nodes => nodes.map(node => {
        const { top, bottom } = node.getBoundingClientRect()
        return { top, bottom }
      }))
      expect(fields[1].top).toBeGreaterThanOrEqual(fields[0].bottom + 6)
    } else await expectTwoColumns(form.locator('.treatment-execution-manager-row'))
    await expectCompactSubmit(form.getByRole('button', { name: 'Xác nhận', exact: true }))
    // The narrow drawer deliberately stacks branch/date to keep the date readable.
    expect((await form.boundingBox()).height).toBeLessThan(width <= 340 ? 430 : 380)
    await form.getByRole('button', { name: 'Ghi chú', exact: true }).click()
    await form.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' }).fill('Theo dõi da sau buổi chăm sóc')
    await expectContained(form)
    await form.getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/mobile-customer-${width}.png`, fullPage: true })
    await auditExecution(page, panel, width, 'customer')
  })
}