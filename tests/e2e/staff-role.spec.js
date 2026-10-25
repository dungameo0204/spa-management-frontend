import { test, expect } from './fixtures'

for (const systemRole of ['STAFF', 'MANAGER']) {
  test(`${systemRole} sửa hồ sơ nhân viên bằng danh sách chức vụ từ API`, async ({ page }) => {
    const writes = []
    let rolesFetched = 0
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (!path.startsWith('/api/')) return route.continue()
      if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Người dùng', system_role: systemRole } } } })
      if (path === '/api/roles') { rolesFetched++; return route.fulfill({ json: { data: [{ id: 10, name: 'BS' }, { id: 20, name: 'KTV' }], total: 2 } }) }
      if (path === '/api/staffs' && route.request().method() === 'GET') return route.fulfill({ json: { data: [{ id: 3, fullname: 'Nguyễn An', phone_number: '0901000000', role_id: 10, role_name: 'BS', branch_id: 1, branch_name: 'Cơ sở 1' }], total: 1 } })
      if (path === '/api/staffs/3' && route.request().method() === 'GET') return route.fulfill({ json: { data: { id: 3, fullname: 'Nguyễn An', phone_number: '0901000000', role_id: 10, role_name: 'BS', branch_id: 1 } } })
      if (path === '/api/staffs/3' && route.request().method() === 'PUT') { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { message: 'Đã lưu' } }) }
      if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở 1' }], total: 1 } })
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto('/login')
    await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
    await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await page.goto('/staffs')
    await page.getByRole('button', { name: 'Xem Nguyễn An' }).click()
    await page.getByRole('button', { name: 'Sửa' }).click()
    const role = page.getByRole('combobox', { name: 'Chức vụ' })
    await expect(role).toHaveValue('10')
    await expect(role.getByRole('option', { name: 'BS' })).toBeAttached()
    await expect(role.getByRole('option', { name: 'KTV' })).toBeAttached()
    await role.selectOption({ label: 'KTV' })
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect.poll(() => writes.length).toBe(1)
    expect(writes[0].role_id).toBe(20)
    expect(rolesFetched).toBeGreaterThan(0)
  })
}