import { useRef } from 'react'
import { parseMoneyInput } from '../utils/format'

const digits = value => String(value ?? '').replace(/[^0-9]/g, '')

export default function MoneyInput({ value, onChange, onBlur, onFocus, ...props }) {
  const composing = useRef(false)
  const rawValue = value === '' || value == null ? '' : digits(value)
  const display = rawValue ? Number(rawValue).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) : ''
  function change(event) {
    if (composing.current || event.nativeEvent?.isComposing) return
    const next = digits(event.target.value)
    if (next === '') onChange('')
    else if (parseMoneyInput(next) !== null) onChange(next)
  }
  return <input {...props} type="text" inputMode="numeric" value={display} onFocus={onFocus} onBlur={onBlur} onCompositionStart={() => { composing.current = true }} onCompositionEnd={event => { composing.current = false; change(event) }} onChange={change} />
}