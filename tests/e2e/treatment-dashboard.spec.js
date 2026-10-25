import { test, expect } from './fixtures'

test('tick buổi hôm nay rồi gán nhân viên qua hai API', async ({ page }) => {
  const writes = []
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    if (path === '/api/treatments/execute' && route.request().method() === 'POST') { writes.push({ path, body: route.request().postDataJSON() }); return route.fulfill({ status: 201, json: { treatmentHistoryId: 77 } }) }
    if (path === '/api/treatments/execute/77/staffs' && route.request().method() === 'PUT') { writes.push({ path, body: route.request().postDataJSON() }); return route.fulfill({ json: { message: 'Đã gán' } }) }
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: [] } } })
    if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da', remaining_sessions: 3, total_sessions: 5, created_at: new Date().toISOString().slice(0, 10) }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B', branch_id: 1 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).check()
  await page.getByRole('combobox', { name: 'Nhân viên thực hiện - Chức vụ khác' }).selectOption('2')
  await page.getByRole('button', { name: 'Xác nhận' }).click()
  await expect.poll(() => writes.length).toBe(2)
  expect(writes).toEqual([{ path: '/api/treatments/execute', body: { treatment_id: 10, staffs: [] } }, { path: '/api/treatments/execute/77/staffs', body: { staffs: [{ staff_id: 2 }] } }])
})

test('quản lý chọn cơ sở ngay ở dòng trước khi xác nhận buổi thực hiện', async ({ page }) => {
  const writes = []
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }], total: 1 } })
    if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'KTV mặt' }, { id: 2, name: 'KTV body' }, { id: 3, name: 'KTV' }, { id: 4, name: 'BS' }], total: 4 } })
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: [] } } })
    if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da', remaining_sessions: 2, created_at: new Date().toISOString().slice(0, 10) }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B', branch_id: 1, role_id: 1 }, { id: 3, fullname: 'Nhân viên C', branch_id: 1, role_id: 2 }, { id: 4, fullname: 'Nhân viên D', branch_id: 1, role_id: 3 }, { id: 5, fullname: 'Bác sĩ E', branch_id: 1, role_id: 4 }], total: 4 } })
    if (path === '/api/treatments/execute' && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { treatmentHistoryId: 77 } }) }
    if (path === '/api/treatments/execute/77/staffs') { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { message: 'Đã gán' } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/')
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).check()
  await page.getByRole('button', { name: 'Xác nhận' }).click()
  await expect(page.getByRole('alert')).toContainText('Chọn cơ sở thực hiện')
  await page.getByRole('combobox', { name: 'Cơ sở thực hiện' }).selectOption('1')
  await page.getByRole('combobox', { name: 'Nhân viên thực hiện - KTV mặt' }).selectOption('2')
  const row = page.locator('.today-staff-actions')
  await expect(row.locator('.role-staff-picker select')).toHaveCount(4)
  const layout = await row.evaluate(element => {
    const selects = [...element.querySelectorAll('select')].map(select => select.getBoundingClientRect())
    const button = element.querySelector('button').getBoundingClientRect()
    const staff = [...element.querySelectorAll('.role-staff-picker select')].map(select => select.getBoundingClientRect())
    return { sameLine: selects.every(select => Math.abs(select.bottom - selects[0].bottom) < 3) && Math.abs(button.bottom - selects[0].bottom) < 3, compact: staff.every(select => select.width <= 115 && select.height <= 33), fits: button.right <= element.getBoundingClientRect().right && selects.every(select => select.right <= element.getBoundingClientRect().right) }
  })
  expect(layout).toEqual({ sameLine: true, compact: true, fits: true })
  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await row.evaluate(element => {
    const strip = element.querySelector('.role-staff-picker')
    const fields = [...strip.querySelectorAll('.field')].map(field => field.getBoundingClientRect())
    const controls = [...element.querySelectorAll('select')]
    const cell = element.closest('td').getBoundingClientRect()
    const box = element.getBoundingClientRect()
    return {
      fullWidth: box.width > cell.width * .85,
      twoColumns: fields.length === 4 && Math.abs(fields[0].top - fields[1].top) < 2 && fields[2].top > fields[0].bottom - 2,
      compact: [...strip.querySelectorAll('select')].every(select => select.getBoundingClientRect().width <= 120 && select.getBoundingClientRect().height <= 33 && parseFloat(getComputedStyle(select).fontSize) <= 12) && controls.every(select => select.getBoundingClientRect().height <= 37),
      fits: fields.every(field => field.right <= strip.getBoundingClientRect().right + 1),
      contained: box.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth,
    }
  })
  expect(mobile).toEqual({ fullWidth: true, twoColumns: true, compact: true, fits: true, contained: true })
  await page.getByRole('button', { name: 'Xác nhận' }).click()
  await expect.poll(() => writes.length).toBe(2)
  expect(writes).toEqual([{ treatment_id: 10, branch_id: 1, staffs: [] }, { staffs: [{ staff_id: 2 }] }])
})

test('thẻ cũ đã làm hôm nay hiện trên tổng quan, sửa nhân viên và hoàn tác bằng DELETE', async ({ page }) => {
  const writes = []
  let executed = true
  const day = new Date().toISOString().slice(0, 10)
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } } } })
    if (path === '/api/treatments/execute/77/staffs' && route.request().method() === 'PUT') { writes.push('PUT'); return route.fulfill({ json: {} }) }
    if (path === '/api/treatments/execute/77' && route.request().method() === 'DELETE') { writes.push('DELETE'); executed = false; return route.fulfill({ json: {} }) }
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: executed ? [{ id: 77, branch_id: 1, execution_date: day, staffs: [{ staff_id: 2, staff_name: 'Nhân viên B' }] }] : [] } } })
    if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, created_at: '2020-01-01', customer_name: 'Khách A', product_name: 'Da', remaining_sessions: 2, branch_id: 2 }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B', branch_id: 1 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page.getByRole('heading', { name: 'Khách hàng hôm nay' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /Đã làm Khách A/ })).toBeChecked()
  await page.getByRole('button', { name: /Sửa nhân viên Khách A/ }).click()
  await page.getByRole('button', { name: 'Xác nhận' }).click()
  await expect.poll(() => writes).toEqual(['PUT'])
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click()
  await expect.poll(() => writes).toEqual(['PUT', 'DELETE'])
})