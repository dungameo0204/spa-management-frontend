import { test, expect } from './fixtures'

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 393, height: 852 }, { width: 320, height: 740 }]) {
  test(`invoice Rosa reference layout ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'MANAGER', fullname: 'Quản lý' } })))
    const products = [
      { id: 20, name: 'Gói nám', price: 30000000, is_product: 0, child_service_ids: [21, 22] },
      { id: 21, name: 'Laser nám', price: 1000000, is_product: 0 },
      { id: 22, name: 'Điện di', price: 1000000, is_product: 0 },
      { id: 23, name: 'Ultra', price: 1000000, is_product: 0 },
      { id: 24, name: 'HFF', price: 1050000, is_product: 1 },
    ]
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/products') return route.fulfill({ json: { data: products, totalPages: 1 } })
      if (/^\/api\/products\/\d+$/.test(path)) return route.fulfill({ json: { data: products.find(product => product.id === Number(path.split('/').pop())) } })
      if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở 1' }], totalPages: 1 } })
      return route.fulfill({ json: { data: [], totalPages: 1, total: 0 } })
    })
    await page.goto('/invoices')
    await page.getByRole('button', { name: 'Tạo hóa đơn', exact: true }).click()
    for (const name of ['Gói nám', 'Ultra', 'HFF']) {
      await page.getByRole('button', { name: 'Thêm sản phẩm / dịch vụ' }).click()
      await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).last().click()
      await page.getByRole('option', { name, exact: true }).click()
    }
    await expect(page.getByText('Trọn đời', { exact: true }).first()).toBeVisible()
    await expect(page.locator('.invoice-service-children li')).toHaveCount(2)
    const picker = page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).first()
    await picker.click()
    await expect(page.locator('.compact-invoice-line').first().getByRole('option', { name: 'Gói nám', exact: true })).toBeVisible()
    const pickerLayer = await page.locator('.compact-invoice-line').first().evaluate(line => {
      const menu = line.querySelector('.picker-options').getBoundingClientRect()
      const style = getComputedStyle(line)
      const menuStyle = getComputedStyle(line.querySelector('.picker-options'))
      return { lineZIndex: Number(style.zIndex), menuZIndex: Number(menuStyle.zIndex), position: menuStyle.position, visible: menu.width > 0 && menu.height > 0 }
    })
    expect(pickerLayer.position).toBe('absolute')
    expect(pickerLayer.visible).toBe(true)
    expect(pickerLayer.lineZIndex).toBeGreaterThan(1)
    expect(pickerLayer.menuZIndex).toBeGreaterThan(pickerLayer.lineZIndex)
    const option = page.locator('.compact-invoice-line').first().getByRole('option', { name: 'Gói nám', exact: true })
    await option.scrollIntoViewIfNeeded()
    expect(await option.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      return element.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2))
    })).toBe(true)
    await option.click()
    await expect(page.locator('.invoice-service-children li')).toHaveCount(2)
    if (viewport.width <= 600) {
      const header = await page.locator('.invoice-header-fields').evaluate(element => {
        const branch = element.querySelector(':scope > .field:not(.picker):not(.invoice-date-field)').getBoundingClientRect()
        const date = element.querySelector('.invoice-date-field').getBoundingClientRect()
        return { aligned: Math.abs(branch.top - date.top) < 1, equal: Math.abs(branch.width - date.width) < 1 }
      })
      expect(header).toEqual({ aligned: true, equal: true })
    }
    const issues = await page.locator('.compact-invoice-line').evaluateAll(lines => {
      const errors = []
      for (const [index, line] of lines.entries()) {
        const bounds = line.getBoundingClientRect()
        const row = line.querySelector('.product-entry-row')
        const controls = [...row.children].filter(element => !element.matches('.invoice-line-actions-row'))
        controls.push(...row.querySelectorAll('.invoice-line-execution-actions, .invoice-line-top-actions'))
        controls.push(...row.querySelectorAll('.invoice-line-note-actions > .invoice-session-actions'))
        for (const button of row.querySelectorAll('.invoice-line-top-actions > button')) {
          const rect = button.getBoundingClientRect()
          const container = button.parentElement.getBoundingClientRect()
          if (rect.top < container.top - 1 || rect.bottom > container.bottom + 1 || rect.left < container.left - 1 || rect.right > container.right + 1) errors.push(`${index}: action escapes its row`)
        }
        const boxes = controls.map(element => ({ name: element.className, rect: element.getBoundingClientRect() })).filter(({ rect }) => rect.width && rect.height)
        for (let i = 0; i < boxes.length; i++) {
          const { name, rect } = boxes[i]
          if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) errors.push(`${index}: overflow ${name}`)
          for (const other of boxes.slice(i + 1)) {
            if (Math.min(rect.right, other.rect.right) - Math.max(rect.left, other.rect.left) > 1 && Math.min(rect.bottom, other.rect.bottom) - Math.max(rect.top, other.rect.top) > 1) errors.push(`${index}: ${name} overlaps ${other.name}`)
          }
        }
        for (const child of line.querySelectorAll('.invoice-service-children li')) {
          const children = [...child.children].map(element => element.getBoundingClientRect())
          for (let i = 0; i < children.length; i++) for (const other of children.slice(i + 1)) {
            const rect = children[i]
            if (Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 1 && Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top) > 1) errors.push(`${index}: child overlap`)
          }
        }
      }
      return errors
    })
    expect(issues).toEqual([])
    if (viewport.width >= 851) {
      const actions = await page.locator('.compact-invoice-line').first().evaluate(line => {
        const total = line.querySelector('.line-total').getBoundingClientRect()
        const actions = line.querySelector('.invoice-line-top-actions').getBoundingClientRect()
        return { afterTotal: actions.left >= total.right - 1 }
      })
      expect(actions).toEqual({ afterTotal: true })
    }
    if (viewport.width <= 600) {
      const actions = await page.locator('.compact-invoice-line').nth(1).evaluate(line => {
        const note = line.querySelector('.invoice-session-actions').getBoundingClientRect()
        const top = line.querySelector('.invoice-line-top-actions').getBoundingClientRect()
        return { sameRow: Math.abs(note.top - top.top) < 2, afterNote: top.left >= note.right - 1 }
      })
      expect(actions).toEqual({ sameRow: true, afterNote: true })
      const money = await page.locator('.compact-invoice-line').first().evaluate(line => {
        const percent = line.querySelector('.percent-field input').getBoundingClientRect()
        const amount = line.querySelector('.money-field:last-of-type input').getBoundingClientRect()
        const total = line.querySelector('.line-total strong').getBoundingClientRect()
        return { delta: Math.max(percent.top, amount.top, total.top) - Math.min(percent.top, amount.top, total.top), percent: percent.top, amount: amount.top, total: total.top }
      })
      expect(money.delta, JSON.stringify(money)).toBeLessThan(2)
      const productAlignment = await page.locator('.compact-invoice-line').nth(2).evaluate(line => {
        const fields = [line.querySelector('.product-picker-stack input'), line.querySelector('.quantity-field input'), line.querySelector('.money-field input')]
        const tops = fields.map(field => field.getBoundingClientRect().top)
        return Math.max(...tops) - Math.min(...tops)
      })
      expect(productAlignment).toBeLessThan(2)
    }
    if (viewport.width >= 1200) {
      const execution = await page.locator('.compact-invoice-line').nth(1).evaluate(line => {
        const total = line.querySelector('.line-total strong').getBoundingClientRect()
        const controls = line.querySelector('.invoice-line-execution-actions').getBoundingClientRect()
        const note = line.querySelector('.invoice-session-actions').getBoundingClientRect()
        return { controls: Math.abs(total.top - controls.top), note: Math.abs(total.top - note.top) }
      })
      expect(execution.controls).toBeLessThan(2)
      expect(execution.note).toBeLessThan(2)
    }
    await page.locator('.invoice-drawer .drawer-body').evaluate(element => { element.scrollTop = 0 })
    await page.screenshot({ path: `test-results/invoice-${viewport.width}x${viewport.height}.png`, fullPage: true })
    for (const [index, name] of ['grouped', 'standalone', 'product'].entries()) {
      const line = page.locator('.compact-invoice-line').nth(index)
      await line.scrollIntoViewIfNeeded()
      await line.screenshot({ path: `test-results/invoice-${viewport.width}-${name}.png` })
    }
    await page.locator('.invoice-drawer .drawer-body').evaluate(element => { element.scrollTop = element.scrollHeight })
    await page.screenshot({ path: `test-results/invoice-${viewport.width}-payment.png`, fullPage: true })
    await page.getByRole('button', { name: 'Ghi chú', exact: true }).first().click()
    await expect(page.getByRole('dialog', { name: 'Ghi chú chung liệu trình' })).toBeVisible()
  })
}