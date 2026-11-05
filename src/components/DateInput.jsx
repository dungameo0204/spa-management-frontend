import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import './DateInput.css'

const pad = value => String(value).padStart(2, '0')
const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/
const slots = [0, 1, 3, 4, 6, 7, 8, 9]

function validIso(value) {
  const match = String(value || '').match(isoPattern)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return year >= 1000 && year <= 9999 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function partsFromIso(value) {
  const match = String(value || '').match(isoPattern)
  return match ? [match[3][0], match[3][1], match[2][0], match[2][1], ...match[1]] : Array(8).fill('')
}

function mask(parts) {
  const chars = ['d', 'd', '/', 'm', 'm', '/', 'y', 'y', 'y', 'y']
  chars[2] = '/'; chars[5] = '/'
  slots.forEach((position, index) => { chars[position] = parts[index] || chars[position] })
  return chars.join('')
}

function toIso(parts, birthDate) {
  const day = `${parts[0] || ''}${parts[1] || ''}`, month = `${parts[2] || ''}${parts[3] || ''}`, year = parts.slice(4).join('')
  if (year.length < 4) return null
  if (birthDate && !day && !month) return validIso(`${year}-01-01`) ? `${year}-01-01` : null
  if (birthDate && !day && month.length === 2) return validIso(`${year}-${month}-01`) ? `${year}-${month}-01` : null
  if (day.length !== 2 || month.length !== 2) return null
  const value = `${year}-${month}-${day}`
  return validIso(value) ? value : null
}

export function dateInputDisplay(value, birthDate = false) {
  const match = String(value || '').match(isoPattern)
  if (!match) return ''
  const [, year, month, day] = match
  if (birthDate && month === '01' && day === '01') return year
  if (birthDate && day === '01') return `${month}/${year}`
  return `${day}/${month}/${year}`
}

export function dateInputValue(text, birthDate = false) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  if (isoPattern.test(raw)) return validIso(raw) ? raw : null
  if (birthDate && /^\d{4}$/.test(raw)) return validIso(`${raw}-01-01`) ? `${raw}-01-01` : null
  if (birthDate && /^(0[1-9]|1[0-2])\/(\d{4})$/.test(raw)) return validIso(`${raw.slice(3)}-${raw.slice(0, 2)}-01`) ? `${raw.slice(3)}-${raw.slice(0, 2)}-01` : null
  const full = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return full && validIso(`${full[3]}-${full[2]}-${full[1]}`) ? `${full[3]}-${full[2]}-${full[1]}` : null
}

function monthStart(date) { return new Date(date.getFullYear(), date.getMonth(), 1) }
function monthLabel(date) { return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date) }

export default function DateInput({ value, onChange, birthDate = false, min, max, required = false, disabled = false, 'aria-label': ariaLabel, className = '', id, ...props }) {
  const generatedId = useId(), inputId = id || generatedId
  const [parts, setParts] = useState(() => partsFromIso(value)), [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => value && validIso(value) ? new Date(`${value}T12:00:00`) : new Date())
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const wrapper = useRef(null), input = useRef(null), calendar = useRef(null), focused = useRef(false), partsRef = useRef(parts), activeIndex = useRef(0)
  const iso = toIso(parts, birthDate), display = mask(parts)
  const withinLimits = next => (!min || next >= min) && (!max || next <= max)
  const selectionIndex = position => slots.findIndex(slot => slot >= position)
  function place(index) { const next = Math.max(0, Math.min(index, 7)), position = slots[next]; activeIndex.current = next; requestAnimationFrame(() => input.current?.setSelectionRange(position, position + 1)) }
  function cursor() { const selected = selectionIndex(input.current?.selectionStart ?? 0); return selected < 0 ? activeIndex.current : selected }
  function positionPopup() { const rect = wrapper.current?.getBoundingClientRect(); if (rect) setPopupPosition({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.right - 250, window.innerWidth - 258)) }) }
  function apply(next) { partsRef.current = next; setParts(next); const parsed = toIso(next, birthDate); if (parsed && withinLimits(parsed)) onChange(parsed); if (!next.some(Boolean)) onChange('') }
  useEffect(() => { if (!focused.current) { const next = partsFromIso(value); partsRef.current = next; setParts(next) } if (value && validIso(value)) setMonth(new Date(`${value}T12:00:00`)) }, [value])
  useEffect(() => { const close = event => { if (!wrapper.current?.contains(event.target) && !calendar.current?.contains(event.target)) setOpen(false) }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close) }, [])
  useEffect(() => { if (!open) return; positionPopup(); window.addEventListener('resize', positionPopup); window.addEventListener('scroll', positionPopup, true); return () => { window.removeEventListener('resize', positionPopup); window.removeEventListener('scroll', positionPopup, true) } }, [open])
  useEffect(() => { input.current?.setCustomValidity(!iso || (min && iso < min) || (max && iso > max) ? 'Vui lòng nhập ngày hợp lệ.' : '') }, [iso, min, max])
  const days = useMemo(() => { const first = monthStart(month), offset = (first.getDay() + 6) % 7, count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return Array.from({ length: offset + count }, (_, index) => index < offset ? null : index - offset + 1) }, [month])
  function keyDown(event) {
    const index = activeIndex.current
    if (/^\d$/.test(event.key)) { event.preventDefault(); const next = [...partsRef.current]; next[index] = event.key; apply(next); place(index + 1); return }
    if (event.key === '/') { event.preventDefault(); place(index < 2 ? 2 : index < 4 ? 4 : 7); return }
    if (event.key === 'Backspace') { event.preventDefault(); const target = Math.max(0, index - 1); const next = [...partsRef.current]; next[target] = ''; apply(next); place(target); return }
    if (event.key === 'Delete') { event.preventDefault(); const next = [...partsRef.current]; next[Math.max(0, index)] = ''; apply(next); place(Math.max(0, index)); return }
    if (event.key === 'ArrowLeft') { event.preventDefault(); place(Math.max(0, index - 1)); return }
    if (event.key === 'ArrowRight') { event.preventDefault(); place(Math.min(7, index + 1)) }
  }
  function change(event) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
    const next = Array(8).fill('')
    if (birthDate && digits.length <= 4) digits.split('').forEach((digit, index) => { next[index + 4] = digit })
    else digits.split('').forEach((digit, index) => { next[index] = digit })
    apply(next)
  }
  function paste(event) { event.preventDefault(); const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8); const start = Math.max(0, cursor()); const next = [...partsRef.current]; digits.split('').forEach((digit, index) => { if (start + index < 8) next[start + index] = digit }); apply(next); place(Math.min(7, start + digits.length)) }
  function choose(day) { const next = `${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(day)}`; if (!withinLimits(next)) return; apply(partsFromIso(next)); setOpen(false); input.current?.focus(); place(7) }
  const calendarPopup = open && createPortal(<div ref={calendar} className="date-input-calendar" style={popupPosition} role="dialog" aria-label={`Lịch ${ariaLabel || ''}`.trim()}><div className="date-input-calendar-head"><button type="button" aria-label="Tháng trước" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={16} /></button><strong>{monthLabel(month)}</strong><button type="button" aria-label="Tháng sau" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={16} /></button></div><div className="date-input-weekdays">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day}>{day}</span>)}</div><div className="date-input-days">{days.map((day, index) => day == null ? <span key={`empty-${index}`} /> : (() => { const next = `${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(day)}`; return <button key={next} type="button" disabled={!withinLimits(next)} className={next === value ? 'is-selected' : ''} onClick={() => choose(day)}>{day}</button> })())}</div></div>, document.body)
  return <><span ref={wrapper} className={`date-input ${className}`.trim()}><input {...props} ref={input} id={inputId} type="text" inputMode="numeric" autoComplete="off" min={min} max={max} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} required={required} disabled={disabled} value={display} onFocus={() => { focused.current = true; place(cursor()) }} onBlur={() => { focused.current = false }} onClick={() => place(cursor())} onKeyDown={keyDown} onPaste={paste} onChange={change} /><button type="button" className="date-input-toggle" aria-label={`Mở lịch ${ariaLabel || ''}`.trim()} disabled={disabled} onClick={() => { positionPopup(); setOpen(current => !current) }}><CalendarDays size={17} /></button></span>{calendarPopup}</>
}