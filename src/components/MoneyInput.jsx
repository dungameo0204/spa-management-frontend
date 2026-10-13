import { parseMoneyInput } from '../utils/format'

export default function MoneyInput({ value, onChange, ...props }) {
  const formatted = value === '' || value == null ? '' : Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
  return <input {...props} type="text" inputMode="numeric" value={formatted} onChange={event => {
    const raw = event.target.value.replace(/[\s.]/g, '')
    if (raw === '') onChange('')
    else if (parseMoneyInput(raw) !== null) onChange(raw)
  }} />
}