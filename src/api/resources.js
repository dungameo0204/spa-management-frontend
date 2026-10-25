import { request, normalizePagedResponse } from './client'

export const paths = {
  users: '/api/users', roles: '/api/roles', branches: '/api/branches', staffs: '/api/staffs',
  customers: '/api/customers', products: '/api/products', invoices: '/api/invoices',
  appointments: '/api/appointments', bookings: '/api/customer-bookings',
  imports: '/api/inventory-imports', expenses: '/api/expenses', wallet: '/api/customer-wallet-logs',
  debts: '/api/debt-payments', treatments: '/api/treatments', commissions: '/api/treatments/commissions',
}
const readonly = new Set(['bookings', 'commissions'])
const restores = new Set(['users', 'roles', 'branches', 'staffs', 'customers', 'products'])
function endpoint(resource) { const path = paths[resource]; if (!path) throw new Error('Tài nguyên không hợp lệ'); return path }
export function listResource(resource, filters = {}, page = 1, pageSize = 20, signal) {
  return request(endpoint(resource), { query: { ...filters, page, pageSize }, signal }).then(result => normalizePagedResponse(result, page, pageSize))
}
export function getResource(resource, id) {
  if (resource === 'commissions') throw new Error('API chi tiết không khả dụng cho tài nguyên này')
  return request(`${endpoint(resource)}/${encodeURIComponent(id)}`).then(result => result.data)
}
export const getCustomerOverview = id => request(`/api/customers/${encodeURIComponent(id)}/overview`).then(result => result.data)
export function createResource(resource, body) {
  if (readonly.has(resource)) throw new Error('Tài nguyên chỉ đọc')
  return request(resource === 'users' ? '/api/users/create' : endpoint(resource), { method: 'POST', body })
}
export function updateResource(resource, id, body) {
  if (readonly.has(resource)) throw new Error('Tài nguyên chỉ đọc')
  return request(`${endpoint(resource)}/${encodeURIComponent(id)}`, { method: 'PUT', body })
}
export function deleteResource(resource, id) {
  if (readonly.has(resource)) throw new Error('Tài nguyên chỉ đọc')
  return request(`${endpoint(resource)}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
export function restoreResource(resource, id) {
  if (!restores.has(resource)) throw new Error('Không hỗ trợ khôi phục')
  return request(`${endpoint(resource)}/${encodeURIComponent(id)}/restore`, { method: 'PATCH' })
}
export const loginRequest = credentials => request('/api/auth/login', { method: 'POST', body: credentials })
export const getSession = () => request('/api/auth/me')
export const getRemainingDebt = id => request(`/api/debt-payments/invoices/${encodeURIComponent(id)}/remaining-debt`).then(r => r.data)
export const getRevenue = range => request('/api/reports/revenue', { query: range })
export const getReportDetails = (type, range, page = 1, pageSize = 20, staffId) => request(`/api/reports/details/${type}`, { query: { ...range, page, pageSize, staffId } }).then(r => normalizePagedResponse(r, page, pageSize))
export const getStaffTotals = (kind, range, page = 1, pageSize = 20) => request(`/api/reports/${kind}`, { query: { ...range, page, pageSize } })
export const getProductRevenue = (range, page = 1, pageSize = 20) => request('/api/reports/products', { query: { ...range, page, pageSize } }).then(r => normalizePagedResponse(r, page, pageSize))
export const getProductInvoices = (id, range, page = 1, pageSize = 20) => request(`/api/reports/products/${encodeURIComponent(id)}/invoices`, { query: { ...range, page, pageSize } }).then(r => normalizePagedResponse(r, page, pageSize))
export const getAppointmentQueue = (kind, filters = {}, page = 1) => request(`/api/appointments/${kind}`, { query: { ...filters, page, pageSize: 20 } }).then(r => normalizePagedResponse(r, page))
export const executeTreatment = body => request('/api/treatments/execute', { method: 'POST', body })
export const assignTreatmentStaffs = (id, staffs) => request(`/api/treatments/execute/${id}/staffs`, { method: 'PUT', body: { staffs } })
export const undoTreatmentExecution = id => request(`/api/treatments/execute/${id}`, { method: 'DELETE' })