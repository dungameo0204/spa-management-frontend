import { test, expect } from '@playwright/test'

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
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B' }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).check()
  await page.getByText(/Chọn nhân viên · 0 người/).click()
  await page.getByRole('checkbox', { name: 'Nhân viên B' }).check()
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
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: [] } } })
    if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da', remaining_sessions: 2, created_at: new Date().toISOString().slice(0, 10) }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B' }], total: 1 } })
    if (path === '/api/treatments/execute' && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { treatmentHistoryId: 77 } }) }
    if (path === '/api/treatments/execute/77/staffs') { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { message: 'Đã gán' } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/')
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).check()
  await page.getByRole('button', { name: 'Xác nhận' }).click()
  await expect(page.getByRole('alert')).toContainText('Chọn cơ sở thực hiện')
  await page.getByRole('combobox', { name: 'Cơ sở thực hiện' }).selectOption('1')
  await page.getByText(/Chọn nhân viên · 0 người/).click()
  await page.getByRole('checkbox', { name: 'Nhân viên B' }).check()
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
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B' }], total: 1 } })
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