import { test, expect } from './fixtures'
import { today } from '../../src/utils/format'

test('tick buổi hôm nay rồi gán nhân viên qua hai API', async ({ page }) => {
  const writes = []
  let executed = false
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    if (path === '/api/treatments/execute' && route.request().method() === 'POST') { executed = true; writes.push({ path, body: route.request().postDataJSON() }); return route.fulfill({ status: 201, json: { treatmentHistoryId: 77 } }) }
    if (path === '/api/treatments/execute/77/staffs' && route.request().method() === 'PUT') { writes.push({ path, body: route.request().postDataJSON() }); return route.fulfill({ json: { message: 'Đã gán' } }) }
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da', branch_id: 1, remaining_sessions: 3, total_sessions: 5, created_at: new Date().toISOString().slice(0, 10), histories: executed ? [{ id: 77, execution_date: today(), branch_id: 1, staffs: [] }] : [] } } })
    if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da', branch_id: 1, remaining_sessions: 3, total_sessions: 5, created_at: new Date().toISOString().slice(0, 10), histories: executed ? [{ id: 77, execution_date: today(), branch_id: 1, staffs: [] }] : [] }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B', branch_id: 1 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).click()
  await page.getByRole('button', { name: 'Nhân viên làm Chăm sóc da' }).click()
  await page.getByRole('dialog', { name: 'Nhân viên làm Chăm sóc da' }).getByRole('checkbox', { name: 'Nhân viên B' }).check()
  await page.getByRole('button', { name: 'Xong', exact: true }).click()
  await expect.poll(() => writes.length).toBe(2)
  expect(writes).toEqual([{ path: '/api/treatments/execute', body: { treatment_id: 10, staffs: [] } }, { path: '/api/treatments/execute/77/staffs', body: { staffs: [{ staff_id: 2 }] } }])
})

test('quản lý tick buổi và gán nhân viên bằng popup, không mở hàng cấu hình', async ({ page }) => {
  const writes = []
  let executed = false
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER', branch_id: 1 } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'manager-test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER', branch_id: 1 } } } })
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }], total: 1 } })
    if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'KTV mặt' }, { id: 2, name: 'KTV body' }, { id: 3, name: 'KTV' }, { id: 4, name: 'BS' }], total: 4 } })
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da', branch_id: 1, remaining_sessions: 2, created_at: new Date().toISOString().slice(0, 10), histories: executed ? [{ id: 77, execution_date: today(), branch_id: 1, staffs: [] }] : [] } } })
    if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da', branch_id: 1, remaining_sessions: 2, created_at: new Date().toISOString().slice(0, 10), histories: executed ? [{ id: 77, execution_date: today(), branch_id: 1, staffs: [] }] : [] }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Nhân viên B', branch_id: 1, role_id: 1 }, { id: 3, fullname: 'Nhân viên C', branch_id: 1, role_id: 2 }, { id: 4, fullname: 'Nhân viên D', branch_id: 1, role_id: 3 }, { id: 5, fullname: 'Bác sĩ E', branch_id: 1, role_id: 4 }], total: 4 } })
    if (path === '/api/treatments/execute' && route.request().method() === 'POST') { executed = true; writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { treatmentHistoryId: 77 } }) }
    if (path === '/api/treatments/execute/77/staffs') { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { message: 'Đã gán' } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/')
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).click()
  await expect(page.locator('.today-staff-actions')).toHaveCount(0)
  const staffButton = page.getByRole('button', { name: /Nhân viên làm/ }).first()
  await expect(staffButton).toBeVisible()
  await staffButton.click()
  const dialog = page.getByRole('dialog', { name: /Nhân viên làm/ })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('checkbox', { name: 'Nhân viên B' }).check()
  await dialog.getByRole('button', { name: 'Xong', exact: true }).click()
  await expect.poll(() => writes.length).toBe(2)
  expect(writes).toEqual([{ treatment_id: 10, branch_id: 1, execution_date: today(), staffs: [] }, { staffs: [{ staff_id: 2 }] }])
})

test('thẻ cũ đã làm hôm nay hiện trên tổng quan, sửa nhân viên và hoàn tác bằng DELETE', async ({ page }) => {
  const writes = []
  let executed = true
  const day = today()
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } } } })
    if (path === '/api/treatments/execute/77/staffs' && route.request().method() === 'PUT') { writes.push('PUT'); return route.fulfill({ json: {} }) }
    if (path === '/api/treatments/execute/77' && route.request().method() === 'DELETE') { writes.push('DELETE'); executed = false; return route.fulfill({ json: {} }) }
    if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: executed ? [{ id: 77, branch_id: 1, execution_date: day, created_at: `${day} 09:00:00`, staffs: [{ staff_id: 2, staff_name: 'Nhân viên B' }] }] : [] } } })
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
  await page.getByRole('button', { name: 'Nhân viên làm Da' }).click()
  await page.getByRole('dialog', { name: 'Nhân viên làm Da' }).getByRole('button', { name: 'Xong', exact: true }).click()
  await expect.poll(() => writes).toEqual(['PUT'])
  await page.getByRole('checkbox', { name: /Đã làm Khách A/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click()
  await expect.poll(() => writes).toEqual(['PUT', 'DELETE'])
  await expect(page.getByRole('checkbox', { name: /Đã làm Khách A/ })).toHaveCount(0)
})

for (const scenario of ['old', 'missing', 'other-branch', 'cancel', 'error', 'manager']) {
  test(`hoàn tác tổng quan: ${scenario}`, async ({ page }) => {
    const day = today()
    const manager = scenario === 'manager'
    const user = { id: 1, fullname: 'Kiểm thử', system_role: manager ? 'MANAGER' : 'STAFF', branch_id: 1 }
    const history = { id: 77, branch_id: scenario === 'other-branch' || manager ? 2 : 1, execution_date: day, created_at: scenario === 'old' || manager ? '2020-01-01 09:00:00' : scenario === 'missing' ? null : `${day} 09:00:00`, staffs: [] }
    let deletes = 0
    let executed = true
    await page.addInitScript(user => localStorage.setItem('xuly.session', JSON.stringify({ token: 'undo-test', user })), user)
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/treatments/execute/77' && route.request().method() === 'DELETE') {
        deletes++
        if (scenario === 'error') return route.fulfill({ status: 403, json: { message: 'Không được hoàn tác buổi này.' } })
        executed = false
        return route.fulfill({ json: {} })
      }
      if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: executed ? [history] : [] } } })
      if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách Undo', product_name: 'Da', branch_id: 1, created_at: day, remaining_sessions: 0 }], total: 1 } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Khách hàng hôm nay' })).toBeVisible()
    const checkbox = page.getByRole('checkbox', { name: /Đã làm Khách Undo/ })
    if (scenario === 'other-branch') {
      // The dashboard must not select a history from another execution branch.
      await expect(checkbox).not.toBeChecked()
      await expect(checkbox).toBeDisabled()
    } else {
      await expect(checkbox).toBeChecked()
      {
        await expect(checkbox).toBeEnabled()
        await checkbox.click()
        const dialog = page.getByRole('alertdialog')
        await expect(dialog).toBeVisible()
        expect(deletes).toBe(0)
        if (scenario === 'cancel') {
          await dialog.getByRole('button', { name: 'Giữ lại' }).click()
          await expect(dialog).toHaveCount(0)
          await expect(checkbox).toBeChecked()
        } else {
          await dialog.getByRole('button', { name: 'Xác nhận' }).click()
          await expect.poll(() => deletes).toBe(1)
          if (scenario === 'error') {
            await expect(page.getByRole('alert')).toContainText('Không được hoàn tác buổi này.')
            await expect(checkbox).toBeChecked()
          } else await expect(checkbox).not.toBeChecked()
        }
      }
    }
    expect(deletes).toBe(scenario === 'cancel' || scenario === 'other-branch' ? 0 : 1)
  })
}