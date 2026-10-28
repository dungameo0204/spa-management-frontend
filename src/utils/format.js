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
export const SPA_TIME_ZONE = 'Asia/Ho_Chi_Minh'
const calendarFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: SPA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })

// Date-only values are calendar days. Offset-free API/form datetimes are Vietnam wall time.
function spaDate(value) {
  if (value == null || value === '') return null
  let input = value
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::(\d{2})(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/i)
    if (!match) return null
    const [, day, time = '00:00', seconds = '00', fraction = '', offset = '+07:00'] = match
    const calendar = new Date(`${day}T00:00:00Z`)
    if (Number.isNaN(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) return null
    if (Number(time.slice(0, 2)) > 23 || Number(time.slice(3)) > 59 || Number(seconds) > 59) return null
    input = `${day}T${time}:${seconds}${fraction}${offset}`
  } else if (!(value instanceof Date) && typeof value !== 'number') return null
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? null : date
}

function spaParts(date) {
  return Object.fromEntries(calendarFormatter.formatToParts(date).map(({ type, value }) => [type, value]))
}

export function dateOnly(value) {
  const date = spaDate(value)
  if (!date) return ''
  const { year, month, day } = spaParts(date)
  return `${year}-${month}-${day}`
}

export function formatSpaDate(value, options = {}) {
  const date = spaDate(value)
  if (!date) return '—'
  if (!Object.keys(options).length) {
    const { year, month, day } = spaParts(date)
    return `${day}/${month}/${year}`
  }
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', ...options, timeZone: SPA_TIME_ZONE }).format(date)
}
export const today = () => dateOnly(new Date())
/** MySQL DATETIME expects Vietnam wall time, never an ISO Z suffix. */
export function toSqlDateTime(value) {
  const date = spaDate(value)
  if (!date) return undefined
  const { year, month, day, hour, minute, second } = spaParts(date)
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}
export function appointmentDate(value) {
  const date = dateOnly(value)
  return date ? `${date} 09:00:00` : undefined
}