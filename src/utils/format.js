export function formatCurrency(value) {
  if (value === undefined || value === null || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount) : '—'
}
export function parseMoneyInput(text) {
  const clean = String(text).replace(/[.\s₫]/g, '')
  if (!/^\d+$/.test(clean)) return null
  const value = Number(clean)
  return Number.isSafeInteger(value) ? value : null
}
export function formatSpaDate(value, options = {}) {
  if (!value) return '—'
  const parts = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (parts && !Object.keys(options).length) return `${parts[3]}/${parts[2]}/${parts[1]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', ...options }).format(date)
}
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
/** MySQL DATETIME expects a local wall-clock string, never an ISO Z suffix. */
export function toSqlDateTime(value) {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) return value.slice(0, 19).replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/.test(value)) return `${value.slice(0, 16).replace('T', ' ')}:${value.length === 16 ? '00' : value.slice(17, 19)}`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}
export function appointmentDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : /^\d{4}-\d{2}-\d{2}/.test(value || '') ? value.slice(0, 10) : undefined
  return date ? `${date} 09:00:00` : undefined
}
export const dateOnly = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : String(value || '').slice(0, 10)