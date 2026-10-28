import { describe, it, expect } from 'vitest'
import { canAccess, canEditSameDay, canUndoTreatmentExecution, resolveBranch } from './permissions'
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

describe('quyền hoàn tác buổi thực hiện', () => {
  const now = new Date('2026-10-28T05:00:00Z')
  const history = { branch_id: 7, execution_date: '2026-10-28 09:00:00', created_at: '2026-10-28 09:01:00' }
  it('cho nhân viên hoàn tác trong ngày tại cơ sở trong token', () => {
    expect(canUndoTreatmentExecution(staff, history, now)).toBe(true)
  })
  it('dùng ngày Việt Nam cho cả ngày tạo và ngày thực hiện tại nửa đêm', () => {
    const midnight = new Date('2026-10-27T17:00:00Z')
    const execution = { branch_id: 7, execution_date: '2026-10-28', created_at: '2026-10-27T17:00:00Z' }
    expect(canEditSameDay(execution, midnight)).toBe(true)
    expect(canUndoTreatmentExecution(staff, execution, midnight)).toBe(true)
    expect(canUndoTreatmentExecution(staff, { ...execution, created_at: '2026-10-27T16:59:59Z' }, midnight)).toBe(false)
    expect(canUndoTreatmentExecution(staff, { ...execution, execution_date: '2026-10-27T16:59:59Z' }, midnight)).toBe(false)
    expect(canUndoTreatmentExecution(staff, execution, new Date('2026-10-28T17:00:00Z'))).toBe(false)
  })
  it.each([
    { branch_id: 8 }, { branch_id: null },
    { execution_date: '2026-10-27 09:00:00' }, { execution_date: '2026-10-29 09:00:00' },
    { created_at: '2026-10-27 09:00:00' }, { created_at: '2026-10-29 09:00:00' },
    { created_at: undefined }, { created_at: 'invalid' }, { execution_date: undefined },
  ])('chặn nhân viên khi lịch sử không đủ điều kiện: %j', changes => {
    expect(canUndoTreatmentExecution(staff, { ...history, ...changes }, now)).toBe(false)
  })
  it('không giới hạn ngày hoặc cơ sở với quản lý', () => {
    expect(canUndoTreatmentExecution(manager, { branch_id: 8, created_at: '2020-01-01', execution_date: '2020-01-01' }, now)).toBe(true)
  })
  it('không cho phép khi thiếu tài khoản, cơ sở hoặc lịch sử', () => {
    expect(canUndoTreatmentExecution(null, history, now)).toBe(false)
    expect(canUndoTreatmentExecution({ system_role: 'STAFF' }, history, now)).toBe(false)
    expect(canUndoTreatmentExecution(staff, null, now)).toBe(false)
    expect(canUndoTreatmentExecution({ system_role: 'OTHER' }, history, now)).toBe(false)
  })
})