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
export function resolveBranch(user, selected) {
  if (user?.system_role === 'STAFF') return { branchId: user.branch_id, locked: true }
  return { branchId: selected ? Number(selected) : null, locked: false }
}
// Only a hint; the backend uses its own clock and creation date to authorize writes.
export function canEditSameDay(record, now = new Date()) {
  const date = record?.created_at
  return Boolean(date && new Date(date).toDateString() === now.toDateString())
}