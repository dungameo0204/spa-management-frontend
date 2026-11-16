import { useRef, useState } from 'react'
import { parseMoneyInput } from '../utils/format'

const digits = value => String(value ?? '').replace(/[^0-9]/g, '')
const integerValue = value => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? String(Math.trunc(number)) : digits(value)
}

export default function MoneyInput({ value, onChange, onBlur, onFocus, ...props }) {
  const composing = useRef(false)
  const [compositionValue, setCompositionValue] = useState(null)
  const rawValue = compositionValue ?? (value === '' || value == null ? '' : integerValue(value))
  const display = compositionValue ?? (rawValue ? Number(rawValue).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) : '')
  function commit(text) {
    const next = digits(text)
    if (next === '') onChange('')
    else if (parseMoneyInput(next) !== null) onChange(next)
  }
  function change(event) {
    if (composing.current || event.nativeEvent?.isComposing) {
      setCompositionValue(event.target.value)
      return
    }
    commit(event.target.value)
  }
  function endComposition(event) {
    composing.current = false
    setCompositionValue(null)
    commit(event.target.value)
  }
  return <input {...props} type="text" inputMode="numeric" value={display} onFocus={onFocus} onBlur={onBlur} onCompositionStart={event => { composing.current = true; setCompositionValue(event.currentTarget.value) }} onCompositionEnd={endComposition} onChange={change} />
}