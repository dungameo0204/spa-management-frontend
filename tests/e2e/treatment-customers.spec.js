import { test, expect } from '@playwright/test'

test('trang liệu trình: ô nhân viên gọn hai cột và chọn bằng menu riêng trên điện thoại', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await context.newPage()
    await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Chăm sóc da', remaining_sessions: 3, total_sessions: 5 }], total: 1 } })
      if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Chăm sóc da', remaining_sessions: 3, total_sessions: 5, histories: [] } } })
      if (path === '/api/customers/1') return route.fulfill({ json: { data: { id: 1, fullname: 'Khách A' } } })
      if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'CS1' }], total: 1 } })
      if (path === '/api/roles') return route.fulfill({ json: { data: [1, 2, 3, 4].map(id => ({ id, name: ['KTV mặt', 'KTV body', 'KTV', 'BS'][id - 1] })), total: 4 } })
      if (path === '/api/staffs') return route.fulfill({ json: { data: [1, 2, 3, 4].map(id => ({ id, fullname: `Nhân viên ${id}`, role_id: id, branch_id: 1 })), total: 4 } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/treatments')
    await page.getByRole('button', { name: 'Khách A: 1 dịch vụ' }).click()
    const card = page.locator('.treatment-card-item')
    await card.getByRole('button', { name: 'Thực hiện hôm nay' }).click()
    const inline = card.locator('.treatment-inline-actions')
    await inline.locator(':scope > .field .mobile-select-trigger').click()
    await page.getByRole('dialog', { name: 'Cơ sở thực hiện' }).getByRole('option', { name: 'CS1' }).click()
    const checkLayout = async picker => {
      await expect(picker.locator('.field')).toHaveCount(4)
      const layout = await picker.evaluate(element => {
        const fields = [...element.querySelectorAll('.field')].map(field => field.getBoundingClientRect())
        const controls = [...element.querySelectorAll('.mobile-select-trigger')].map(control => control.getBoundingClientRect())
        return { twoColumns: Math.abs(fields[0].top - fields[1].top) < 2 && fields[2].top >= fields[0].bottom, compact: controls.every(box => box.height <= 33 && box.width <= 121), fits: fields.every(box => box.left >= 0 && box.right <= innerWidth) && document.documentElement.scrollWidth <= innerWidth }
      })
      expect(layout).toEqual({ twoColumns: true, compact: true, fits: true })
    }
    await checkLayout(inline.locator('.role-staff-picker'))
    await inline.getByRole('button', { name: 'Nhân viên thực hiện - KTV mặt' }).click()
    await page.getByRole('dialog', { name: 'Nhân viên thực hiện - KTV mặt' }).getByRole('option', { name: 'Nhân viên 1' }).click()
    await expect(inline.getByRole('combobox', { name: 'Nhân viên thực hiện - KTV mặt' })).toHaveValue('1')

    await card.getByRole('button', { name: /Chăm sóc da.*Xem lịch sử/ }).click()
    await page.getByRole('dialog', { name: 'Chăm sóc da' }).getByRole('button', { name: 'Thực hiện hôm nay' }).click()
    const drawer = page.locator('.treatment-execution-drawer')
    await drawer.locator('.treatment-execution-form>.field .mobile-select-trigger').click()
    await page.getByRole('dialog', { name: 'Cơ sở thực hiện' }).getByRole('option', { name: 'CS1' }).click()
    await checkLayout(drawer.locator('.role-staff-picker'))
    await drawer.getByRole('button', { name: 'Nhân viên thực hiện - KTV body' }).click()
    await page.getByRole('dialog', { name: 'Nhân viên thực hiện - KTV body' }).getByRole('option', { name: 'Nhân viên 2' }).click()
    await expect(drawer.getByRole('combobox', { name: 'Nhân viên thực hiện - KTV body' })).toHaveValue('2')
    await context.close()
})

test('form thực hiện trong chi tiết thẻ gọn trên desktop và không tràn trên điện thoại', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Chăm sóc da', remaining_sessions: 2, total_sessions: 5 }], total: 1, totalPages: 1 } })
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Chăm sóc da', remaining_sessions: 2, total_sessions: 5, histories: [] } } })
    if (path === '/api/customers/1') return route.fulfill({ json: { data: { id: 1, fullname: 'Khách A' } } })
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'CS1' }], total: 1 } })
    if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'KTV mặt' }, { id: 2, name: 'KTV body' }, { id: 3, name: 'KTV' }, { id: 4, name: 'BS' }], total: 4 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [1, 2, 3, 4].map(id => ({ id, fullname: `Nhân viên ${id}`, role_id: id, branch_id: 1 })), total: 4 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/treatments')
  await expect(page.locator('.treatment-customers')).toContainText('Khách A')
  await page.getByRole('button', { name: 'Khách A: 1 dịch vụ' }).click()
  await page.getByRole('button', { name: /Chăm sóc da.*Xem lịch sử/ }).click()
  await page.getByRole('dialog', { name: 'Chăm sóc da' }).getByRole('button', { name: 'Thực hiện hôm nay' }).click()
  const drawer = page.locator('.treatment-execution-drawer')
  await drawer.getByRole('combobox', { name: 'Cơ sở thực hiện' }).selectOption('1')
  await expect(drawer.locator('.role-staff-picker select')).toHaveCount(4)
  const desktop = await drawer.evaluate(element => {
    const boxes = [...element.querySelectorAll('.role-staff-picker select')].map(select => select.getBoundingClientRect())
    const form = element.querySelector('form').getBoundingClientRect()
    return { rows: boxes.map(box => Math.round(box.top)), widths: boxes.map(box => box.width), heights: boxes.map(box => box.height), formHeight: form.height, right: Math.max(...boxes.map(box => box.right)), drawerRight: element.getBoundingClientRect().right }
  })
  expect(new Set(desktop.rows).size).toBe(1)
  expect(desktop.widths.every(width => width <= 115)).toBe(true)
  expect(desktop.heights.every(height => height <= 33)).toBe(true)
  expect(desktop.formHeight).toBeLessThan(220)
  expect(desktop.right).toBeLessThanOrEqual(desktop.drawerRight)
  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await drawer.evaluate(element => {
    const form = element.querySelector('form'), fields = [...form.querySelectorAll('select, button')]
    const left = form.getBoundingClientRect().left, right = form.getBoundingClientRect().right
    const staffSelects = [...form.querySelectorAll('.role-staff-picker select')].map(select => select.getBoundingClientRect())
    return { scroll: form.scrollWidth, width: form.clientWidth, inBounds: fields.every(field => field.getBoundingClientRect().left >= left && field.getBoundingClientRect().right <= right), compact: staffSelects.every(select => select.width <= 120 && select.height <= 33) }
  })
  expect(mobile.scroll).toBeLessThanOrEqual(mobile.width + 1)
  expect(mobile.inBounds).toBe(true)
  expect(mobile.compact).toBe(true)
})

test('trang liệu trình hiển thị chung mọi cơ sở dù nhân viên hay quản lý chọn cơ sở', async ({ browser }) => {
  const cards = [
    { id: 10, customer_id: 1, customer_name: 'Khách cơ sở 1', product_name: 'Dịch vụ 1', branch_id: 1, remaining_sessions: 2, total_sessions: 3 },
    { id: 11, customer_id: 2, customer_name: 'Khách cơ sở 2', product_name: 'Dịch vụ 2', branch_id: 2, remaining_sessions: 2, total_sessions: 3 },
  ]
  for (const [role, branchId] of [['STAFF', 1], ['STAFF', 2], ['MANAGER', 2]]) {
    const page = await browser.newPage()
    const queries = []
    await page.addInitScript(({ role, branchId }) => {
      localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: branchId, fullname: 'Người dùng', system_role: role, branch_id: branchId } }))
      sessionStorage.setItem('xuly.branch', String(branchId))
    }, { role, branchId })
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url())
      if (!url.pathname.startsWith('/api/')) return route.continue()
      if (url.pathname === '/api/treatments') {
        queries.push(url.searchParams)
        return route.fulfill({ json: { data: url.searchParams.has('branchId') ? cards.filter(card => card.branch_id === Number(url.searchParams.get('branchId'))) : cards, total: 2, totalPages: 1 } })
      }
      if (url.pathname === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở 1' }, { id: 2, name: 'Cơ sở 2' }] } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/treatments')
    await expect(page.locator('.treatment-customers tbody tr:not(.treatment-expanded-row)')).toHaveCount(2)
    await expect(page.locator('.treatment-customers')).toContainText('Khách cơ sở 1')
    await expect(page.locator('.treatment-customers')).toContainText('Khách cơ sở 2')
    expect(queries.length).toBeGreaterThan(0)
    expect(queries.every(query => !query.has('branchId'))).toBe(true)
    await page.getByRole('button', { name: 'Khách cơ sở 1: 1 dịch vụ' }).click()
    await page.locator('.treatment-card-item').getByRole('button', { name: 'Thực hiện hôm nay' }).click()
    if (role === 'STAFF') await expect(page.getByRole('button', { name: 'Xác nhận hôm nay' })).toBeEnabled()
    else await expect(page.getByRole('combobox', { name: 'Cơ sở thực hiện' })).toHaveValue('2')
    await page.close()
  }
})

test('dark mode giữ màu chữ và nền dễ đọc trên desktop và mobile', async ({ page }) => {
  await page.goto('/login')
  await page.setContent(`<link rel="stylesheet" href="/src/styles/tokens.css"><link rel="stylesheet" href="/src/styles/global.css"><div class="app-shell"><aside class="sidebar"><span class="brand"><small>SPA</small></span><a class="nav-item">Menu</a><button class="logout-link">Đăng xuất</button></aside><main class="workspace"><header class="topbar"><span class="topbar-title"><span>QUẢN LÝ</span></span></header><div class="stat-card"><span class="stat-label">Thống kê</span><span class="time-chip">Hôm nay</span></div><div class="quick-card"><span class="quick-icon sage">+</span><span class="badge success">Đã xong</span></div><div class="list-panel treatment-customers"><div class="search-box"><span>⌕</span></div><table><thead><tr><th>Khách hàng</th></tr></thead><tbody><tr class="treatment-expanded-row"><td><div class="treatment-card-item"><button class="text-action">Xem lịch sử</button><span class="small-muted">Ngày tạo</span></div></td></tr></tbody></table></div><div class="field">Tên dịch vụ</div><p class="helper-text">Ghi chú</p><p class="success-alert">Thành công</p><p class="form-alert">Lỗi</p><div class="report-stat"><small>Doanh thu</small></div><div class="report-tabs"><button>Tháng</button></div><div class="empty-state">Không có dữ liệu</div></main></div>`)
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  await expect(page.locator('.treatment-card-item')).toBeVisible()
  await expect.poll(() => page.locator('.treatment-card-item').evaluate(card => getComputedStyle(card).backgroundColor)).toBe('rgb(48, 58, 52)')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const colors = await page.evaluate(() => {
      const color = (selector, property) => getComputedStyle(document.querySelector(selector))[property]
      const root = getComputedStyle(document.documentElement)
      return {
        row: color('.treatment-expanded-row>td', 'backgroundColor'),
        card: color('.treatment-card-item', 'backgroundColor'),
        border: color('.treatment-card-item', 'borderTopColor'),
        action: color('.treatment-card-item .text-action', 'backgroundColor'),
        actionText: color('.treatment-card-item .text-action', 'color'),
        dateText: color('.treatment-card-item .small-muted', 'color'),
        captions: ['.brand small', '.topbar-title span', '.stat-label', '.search-box', 'th', '.field', '.helper-text', '.report-stat small', '.empty-state'].map(selector => color(selector, 'color')),
        highContrast: ['.logout-link', '.report-tabs button'].map(selector => color(selector, 'color')),
        successText: color('.success-alert', 'color'),
        successBackground: color('.success-alert', 'backgroundColor'),
        errorText: color('.form-alert', 'color'),
        errorBackground: color('.form-alert', 'backgroundColor'),
        status: color('.badge.success', 'color'),
        statusBackground: color('.badge.success', 'backgroundColor'),
        ink: root.getPropertyValue('--ink').trim(),
        muted: root.getPropertyValue('--muted').trim(),
        cream: root.getPropertyValue('--cream').trim(),
        white: root.getPropertyValue('--white').trim(),
        line: root.getPropertyValue('--line').trim(),
        sageLight: root.getPropertyValue('--sage-light').trim(),
      }
    })
    const rgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`
    expect(colors.row).toBe(rgb(colors.cream))
    expect(colors.card).toBe(rgb(colors.white))
    expect(colors.border).toBe(rgb(colors.line))
    expect(colors.action).toBe(rgb(colors.sageLight))
    expect(colors.actionText).toBe(rgb(colors.ink))
    expect(colors.dateText).toBe(rgb(colors.muted))
    expect(colors.captions).toEqual(Array(9).fill(rgb(colors.muted)))
    expect(colors.highContrast).toEqual(Array(2).fill(rgb(colors.ink)))
    expect(colors.successText).toBe('rgb(208, 245, 215)')
    expect(colors.successBackground).toBe('rgb(41, 76, 58)')
    expect(colors.errorText).toBe('rgb(255, 214, 218)')
    expect(colors.errorBackground).toBe('rgb(75, 48, 53)')
    expect(colors.statusBackground).toBe('rgb(41, 76, 58)')
    expect(colors.status).toBe('rgb(208, 245, 215)')
  }
})

test('gộp liệu trình theo khách qua nhiều trang API, thực hiện/gán công và xem lịch sử', async ({ page }) => {
  const writes = []
  let remaining = 3
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const cards = [
    { id: 10, customer_id: 1, customer_name: 'Hoàng Mạnh Hùng', product_name: 'Chăm sóc da', remaining_sessions: remaining, total_sessions: 5, created_at: '2026-10-12' },
    { id: 11, customer_id: 1, customer_name: 'Hoàng Mạnh Hùng', product_name: 'Massage', remaining_sessions: 3, total_sessions: 5, created_at: '2026-10-11' },
    { id: 12, customer_id: 2, customer_name: 'Hoàng Hùng', product_name: 'Liệu trình khác', remaining_sessions: 1, total_sessions: 5 },
    { id: 13, customer_id: 1, customer_name: 'Hoàng Mạnh Hùng', product_name: 'Hết buổi', remaining_sessions: 0, total_sessions: 5 },
  ]
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/treatments' && route.request().method() === 'GET') {
      const pageNumber = Number(url.searchParams.get('page'))
      return route.fulfill({ json: { data: pageNumber === 1 ? cards.slice(0, 1).map(c => ({ ...c, remaining_sessions: remaining })) : cards.slice(1), total: 4, totalPages: 2 } })
    }
    if (path === '/api/treatments/execute' && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); remaining--; return route.fulfill({ status: 201, json: { treatmentHistoryId: 77 } }) }
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { ...cards[0], remaining_sessions: remaining, histories: [...Array(writes.length)].map((_, index) => ({ id: 77 + index, branch_id: 1, execution_date: today, staffs: [{ staff_name: 'Nhân viên B' }] })) } } })
    if (path === '/api/treatments/11') return route.fulfill({ json: { data: { ...cards[1], histories: [{ id: 88, execution_date: today }, { id: 89, execution_date: '2020-01-01' }] } } })
    if (path === '/api/customers/1') return route.fulfill({ json: { data: { id: 1, phone_number: '0901234567', total_debt: 250000 } } })
    if (path === '/api/customers/2') return route.fulfill({ json: { data: { id: 2, phone_number: '0912345678', total_debt: 0 } } })
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B', branch_id: 1 }, { id: 14, fullname: 'Nhân viên khác cơ sở', branch_id: 2 }], total: 2 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/treatments')
  await page.getByRole('textbox', { name: 'Tìm kiếm' }).fill('hùng')
  await expect(page.locator('.treatment-customers tbody tr:not(.treatment-expanded-row)')).toHaveCount(2)
  await expect(page.locator('.treatment-customers thead th')).toHaveText(['Khách hàng', 'Số điện thoại', 'Tiền nợ', 'Dịch vụ', 'Đã hoàn thành'])
  await expect(page.locator('.treatment-customers tbody tr').first()).toContainText('0901234567')
  await expect(page.locator('.treatment-customers tbody tr').first()).toContainText('250.000')
  await expect(page.locator('.treatment-customers tbody tr').nth(1)).toContainText('0912345678')
  await page.getByRole('button', { name: 'Hoàng Mạnh Hùng: 2 dịch vụ' }).click()
  await expect(page.locator('.treatment-card-item')).toHaveCount(2)
  const sessionColumns = await page.locator('.treatment-card-item .treatment-sessions').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().left)))
  expect(new Set(sessionColumns).size).toBe(1)
  await expect(page.locator('.treatment-card-item .text-action').first()).not.toContainText('còn')
  await expect(page.getByText('Hết buổi')).toHaveCount(0)
  await expect(page.locator('.treatment-card-item').first().locator('.today-execution-badge')).toHaveCount(0)
  await expect(page.locator('.treatment-card-item').nth(1).locator('.today-execution-badge')).toHaveText('Đã thực hiện 1 buổi hôm nay')
  await page.locator('.treatment-card-item').first().getByRole('button', { name: 'Thực hiện hôm nay' }).click()
  await page.getByRole('combobox', { name: 'Cơ sở thực hiện' }).selectOption('1')
  await expect(page.getByRole('combobox', { name: 'Nhân viên thực hiện - Chức vụ khác' })).not.toContainText('Nhân viên khác cơ sở')
  await page.getByRole('combobox', { name: 'Nhân viên thực hiện - Chức vụ khác' }).selectOption('2')
  const layout = await page.locator('.treatment-inline-actions').evaluate(container => {
    const controls = [...container.querySelectorAll('select')]
    return { rows: controls.map(select => Math.round(select.getBoundingClientRect().bottom)), sizes: controls.map(select => parseFloat(getComputedStyle(select).fontSize)), staff: [...container.querySelectorAll('.role-staff-picker select')].map(select => ({ width: select.getBoundingClientRect().width, height: select.getBoundingClientRect().height })), buttonBottom: Math.round(container.querySelector('button').getBoundingClientRect().bottom) }
  })
  expect(new Set(layout.rows).size).toBe(1)
  expect(layout.sizes.every(size => size <= 12)).toBe(true)
  expect(layout.staff.every(select => select.width <= 115 && select.height <= 33)).toBe(true)
  expect(Math.abs(layout.buttonBottom - layout.rows[0])).toBeLessThan(3)
  await page.setViewportSize({ width: 390, height: 844 })
  const expandedLayout = await page.locator('.treatment-customers .treatment-expanded-row').evaluate(row => {
    const table = row.closest('table').getBoundingClientRect()
    const cards = [...row.querySelectorAll('.treatment-card-item')].map(card => card.getBoundingClientRect())
    return { cardsInsideTable: cards.every(card => card.left >= table.left && card.right <= table.right + 1), pageFits: document.documentElement.scrollWidth <= innerWidth }
  })
  expect(expandedLayout).toEqual({ cardsInsideTable: true, pageFits: true })
  const mobileSessions = await page.locator('.treatment-card-item .treatment-sessions').evaluateAll(elements => elements.map(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, cardRight: element.closest('.treatment-card-item').getBoundingClientRect().right })))
  expect(mobileSessions.every(box => box.left >= 0 && box.right <= box.cardRight)).toBe(true)
  const mobile = await page.locator('.treatment-inline-actions').evaluate(element => {
    const card = element.closest('.treatment-card-item').getBoundingClientRect()
    const box = element.getBoundingClientRect()
    const strip = element.querySelector('.role-staff-picker')
    const select = strip.querySelector('select').getBoundingClientRect()
    return {
      fullWidth: box.width >= card.width - 34,
      compact: select.width <= 120 && select.height <= 33 && parseFloat(getComputedStyle(strip.querySelector('select')).fontSize) === 12,
      contained: box.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth,
    }
  })
  expect(mobile).toEqual({ fullWidth: true, compact: true, contained: true })
  await page.getByRole('button', { name: 'Xác nhận hôm nay' }).click()
  await expect.poll(() => writes).toEqual([{ treatment_id: 10, branch_id: 1, staffs: [{ staff_id: 2 }] }])
  await expect(page.locator('.treatment-card-item').first().locator('.today-execution-badge')).toHaveText('Đã thực hiện 1 buổi hôm nay')
  await expect(page.locator('.treatment-card-item').nth(1).locator('.today-execution-badge')).toHaveText('Đã thực hiện 1 buổi hôm nay')
  await page.setViewportSize({ width: 1440, height: 900 })
  const badgePositions = await page.locator('.treatment-card-item .today-execution-badge').evaluateAll(badges => badges.map(badge => Math.round(badge.getBoundingClientRect().left)))
  expect(new Set(badgePositions).size).toBe(1)
  await page.locator('.treatment-card-item').first().getByRole('button', { name: 'Thực hiện hôm nay' }).click()
  await page.getByRole('combobox', { name: 'Cơ sở thực hiện' }).selectOption('1')
  await page.getByRole('button', { name: 'Xác nhận hôm nay' }).click()
  await expect.poll(() => writes).toHaveLength(2)
  await expect(page.locator('.treatment-card-item').first().locator('.today-execution-badge')).toHaveText('Đã thực hiện 2 buổi hôm nay')
  await page.locator('.treatment-card-item').first().getByRole('button', { name: /Chăm sóc da.*Xem lịch sử/ }).click()
  await expect(page.getByRole('heading', { name: 'Lịch sử thực hiện' })).toBeVisible()
  await expect(page.locator('.drawer')).toContainText('Nhân viên B')
  await expect(page.locator('.drawer .line-item').first()).toContainText(`Cơ sở thực hiện: Cơ sở Một`)
})

test('buổi cuối vẫn hiện đến hết ngày, xếp sau thẻ còn buổi và không thể thực hiện thêm', async ({ page }) => {
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message))
  let remaining = 1
  const day = new Date()
  const today = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/treatments' && route.request().method() === 'GET') return route.fulfill({ json: { data: [
      { id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Buổi cuối', remaining_sessions: remaining, total_sessions: 1 },
      { id: 11, customer_id: 2, customer_name: 'Khách B', product_name: 'Còn buổi', remaining_sessions: 2, total_sessions: 3 },
      { id: 12, customer_id: 3, customer_name: 'Khách C', product_name: 'Đã hết hôm trước', remaining_sessions: 0, total_sessions: 1 },
    ], totalPages: 1 } })
    if (path === '/api/treatments/execute' && route.request().method() === 'POST') { remaining = 0; return route.fulfill({ status: 201, json: { treatmentHistoryId: 77 } }) }
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: remaining ? [] : [{ id: 77, execution_date: today }] } } })
    if (path === '/api/treatments/12') return route.fulfill({ json: { data: { id: 12, histories: [{ id: 88, execution_date: '2020-01-01' }] } } })
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }] } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/treatments')
  console.log('PAGE URL:', page.url())
  await expect(page.locator('.treatment-customers')).not.toContainText('Khách C')
  await page.getByRole('button', { name: 'Khách A: 1 dịch vụ' }).click()
  await page.locator('.treatment-card-item').getByRole('button', { name: 'Thực hiện hôm nay' }).click()
  await page.getByRole('combobox', { name: 'Cơ sở thực hiện' }).selectOption('1')
  await page.getByRole('button', { name: 'Xác nhận hôm nay' }).click()
  await expect(page.locator('.treatment-customers tbody tr:not(.treatment-expanded-row)')).toHaveCount(3)
  await expect(page.locator('.treatment-customers tbody tr:not(.treatment-expanded-row)').first()).toContainText('Khách B')
  await expect(page.getByRole('button', { name: 'Khách C: 1 đã hoàn thành' })).toBeVisible()
  const customerButton = page.getByRole('button', { name: 'Khách A: 1 dịch vụ' })
  if (await customerButton.getAttribute('aria-expanded') !== 'true') await customerButton.click()
  await expect(page.locator('.treatment-card-item')).toContainText('Buổi cuối · Xem lịch sử')
  await expect(page.locator('.treatment-card-item .treatment-sessions')).toHaveText('Còn 0/1 buổi')
  await expect(page.locator('.treatment-card-item')).toContainText('Đã hoàn tất hôm nay')
  await expect(page.locator('.treatment-card-item .today-execution-badge')).toHaveText('Đã thực hiện 1 buổi hôm nay')
  await expect(page.locator('.treatment-card-item').getByRole('button', { name: 'Thực hiện hôm nay' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Khách A: 1 đã hoàn thành' })).toBeVisible()
})

test('STAFF chỉ chọn được nhân viên ở cơ sở tài khoản khi gán lịch sử liệu trình', async ({ page }) => {
  const writes = []
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/auth/login') return route.fulfill({ json: { data: { token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } } } })
    if (url.pathname === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Triệt lông', remaining_sessions: 2, total_sessions: 5 }], total: 1, totalPages: 1 } })
    if (url.pathname === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, customer_id: 1, customer_name: 'Khách A', product_name: 'Triệt lông', remaining_sessions: 2, total_sessions: 5, histories: [{ id: 77, branch_id: 1, execution_date: '2026-10-13', staffs: [] }, { id: 78, branch_id: 2, execution_date: '2026-10-12', staffs: [] }] } } })
    if (url.pathname === '/api/customers/1') return route.fulfill({ json: { data: { id: 1, fullname: 'Khách A' } } })
    if (url.pathname === '/api/roles') return route.fulfill({ json: { data: [{ id: 4, name: 'KTV' }], total: 1 } })
    if (url.pathname === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Cùng cơ sở', role_id: 4, branch_id: 1 }, { id: 14, fullname: 'Khác cơ sở', role_id: 4, branch_id: 2 }], total: 2 } })
    if (url.pathname === '/api/treatments/execute/77/staffs' && route.request().method() === 'PUT') { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { message: 'Đã gán' } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/treatments')
  await expect(page.locator('.treatment-customers')).toContainText('Khách A')
  await page.getByRole('button', { name: 'Khách A: 1 dịch vụ' }).click()
  await page.getByRole('button', { name: /Triệt lông.*Xem lịch sử/ }).click()
  await expect(page.locator('.drawer .line-item').first()).toContainText('Cơ sở thực hiện: Cơ sở #1')
  await expect(page.locator('.drawer .line-item').nth(1)).toContainText('Cơ sở thực hiện: Cơ sở #2')
  await expect(page.locator('.drawer').getByRole('button', { name: 'Gán nhân viên' })).toHaveCount(1)
  await expect(page.locator('.drawer').getByRole('button', { name: 'Hoàn tác' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Gán nhân viên' }).click()
  const picker = page.getByRole('combobox', { name: 'Nhân viên thực hiện - KTV' })
  await expect(picker).toContainText('Cùng cơ sở')
  await expect(picker).not.toContainText('Khác cơ sở')
  await picker.selectOption('2')
  await page.locator('.drawer').getByRole('button', { name: 'Xác nhận' }).click()
  await expect.poll(() => writes).toEqual([{ staffs: [{ staff_id: 2 }] }])
})