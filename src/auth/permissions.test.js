import { describe, it, expect } from 'vitest'
import { canAccess, resolveBranch } from './permissions'
const staff = { system_role: 'STAFF', branch_id: 7 }
const manager = { system_role: 'MANAGER', branch_id: null }
describe('phân quyền sản phẩm', () => {
  it('cho STAFF quản lý sản phẩm nhưng không xem báo cáo, công ca hoặc hoa hồng tư vấn', () => {
    expect(canAccess(staff, 'products.view')).toBe(true)
    expect(canAccess(staff, 'products.manage')).toBe(true)
    expect(canAccess(staff, 'reports.view')).toBe(false)
    expect(canAccess(staff, 'commissions.view')).toBe(false)
    expect(canAccess(staff, 'consultants.view')).toBe(false)
  })
  it('cho MANAGER quản trị sản phẩm', () => {
    expect(canAccess(manager, 'products.manage')).toBe(true)
    expect(canAccess(manager, 'reports.view')).toBe(true)
    expect(canAccess(manager, 'commissions.view')).toBe(true)
    expect(canAccess(manager, 'consultants.view')).toBe(true)
  })
  it('khóa STAFF theo chi nhánh token', () => {
    expect(resolveBranch(staff, '999')).toEqual({ branchId: 7, locked: true })
    expect(resolveBranch(manager, '8')).toEqual({ branchId: 8, locked: false })
  })
})