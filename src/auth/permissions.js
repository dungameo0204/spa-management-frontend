const managers = ['MANAGER']
const everyone = ['MANAGER', 'STAFF']
export const permissions = {
  'branches.manage': managers, 'roles.manage': managers, 'products.view': everyone,
  'products.manage': everyone, 'reports.view': managers, 'users.manage': managers,
  'treatments.create': managers, 'staffs.manage': everyone, 'customers.manage': everyone,
  'appointments.manage': everyone, 'invoices.manage': everyone, 'inventory.manage': everyone,
  'expenses.manage': everyone, 'wallet.manage': everyone, 'debts.manage': everyone,
  'treatments.execute': everyone, 'bookings.view': everyone, 'commissions.view': managers, 'consultants.view': managers,
}
export function canAccess(user, permission) { return Boolean(user && permissions[permission]?.includes(user.system_role)) }
export function canFollowUpTreatmentHistory(user, history) {
  return Boolean(history?.id && !history.deleted_at && (user?.system_role === 'MANAGER' ||
    (user?.system_role === 'STAFF' && user.branch_id != null && history.branch_id != null && Number(user.branch_id) === Number(history.branch_id))))
}
export function resolveBranch(user, selected) {
  if (user?.system_role === 'STAFF') return { branchId: user.branch_id, locked: true }
  return { branchId: selected ? Number(selected) : null, locked: false }
}
// Only a hint; the backend uses its own clock and creation date to authorize writes.
export function canEditSameDay(record, now = new Date()) {
  const date = record?.created_at
  return Boolean(date && new Date(date).toDateString() === now.toDateString())
}
export function canUndoTreatmentExecution(user, history, now = new Date()) {
  if (!history) return false
  if (user?.system_role === 'MANAGER') return true
  return user?.system_role === 'STAFF' && user.branch_id != null && history.branch_id != null &&
    Number(user.branch_id) === Number(history.branch_id) &&
    canEditSameDay(history, now) && canEditSameDay({ created_at: history.execution_date }, now)
}