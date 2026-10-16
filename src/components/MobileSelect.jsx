import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'

// The native select remains the form value and validation source. Both visual
// menus use its options so callers keep their existing data flow.
export default function MobileSelect({ children, value, onChange, ...props }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState(null)
  const [inferredTitle, setInferredTitle] = useState('Chọn mục')
  const selectRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const optionsRef = useRef([])
  const titleId = useId()
  const menuId = useId()
  const options = selectRef.current ? Array.from(selectRef.current.options) : []
  optionsRef.current = options.map(option => ({ value: option.value, text: option.text, disabled: option.disabled }))
  const title = props['aria-label'] || inferredTitle
  const selectedText = options.find(option => option.value === String(value ?? ''))?.text || selectRef.current?.selectedOptions[0]?.text || 'Chọn mục'
  const isPhone = () => window.matchMedia?.('(max-width: 767px) and (pointer: coarse)').matches || false

  useEffect(() => {
    setInferredTitle(selectRef.current?.closest('label')?.firstChild?.textContent?.trim() || 'Chọn mục')
  }, [])

  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const show = event => {
    if (props.disabled) return
    event?.preventDefault()
    const chosen = optionsRef.current.findIndex(option => option.value === String(value ?? '') && !option.disabled)
    setActive(chosen >= 0 ? chosen : Math.max(0, optionsRef.current.findIndex(option => !option.disabled)))
    if (!isPhone()) {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) {
        const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 16)
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
        const height = Math.min(optionsRef.current.length * 42 + 12, 280, window.innerHeight * .5)
        const above = window.innerHeight - rect.bottom < height + 8 && rect.top > window.innerHeight - rect.bottom
        setPosition({ left, width, top: above ? Math.max(8, rect.top - height - 5) : Math.min(rect.bottom + 5, window.innerHeight - height - 8), maxHeight: height })
      }
    }
    setOpen(true)
  }

  const choose = option => {
    if (option.disabled) return
    onChange?.({ target: { value: option.value } })
    close(true)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = event => {
      if (!menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) close()
    }
    const onScroll = event => {
      if (!isPhone() && !menuRef.current?.contains(event.target)) close()
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); return }
      if (isPhone()) return
      const items = optionsRef.current
      if (!items.length) return
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        setActive(current => {
          if (event.key === 'Home') return items.findIndex(item => !item.disabled)
          if (event.key === 'End') return items.findLastIndex(item => !item.disabled)
          let next = current
          do { next = (next + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length } while (items[next]?.disabled && next !== current)
          return next
        })
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        const selected = items[active]
        if (selected && !selected.disabled) { onChange?.({ target: { value: selected.value } }); close(true) }
      } else if (event.key === 'Tab') close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open, active, onChange])

  useEffect(() => {
    if (!open || isPhone()) return
    const menu = menuRef.current
    const item = menu?.querySelector('[data-active="true"]')
    if (!item) return
    if (item.offsetTop < menu.scrollTop) menu.scrollTop = item.offsetTop
    else if (item.offsetTop + item.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = item.offsetTop + item.offsetHeight - menu.clientHeight
  }, [open, active])

  return <><select ref={selectRef} value={value} onChange={onChange} {...props} aria-label={title} tabIndex={-1}
      onPointerDown={show} onClick={show} onInvalid={() => triggerRef.current?.focus()}>
      {children}
    </select>
    <span ref={triggerRef} role="button" tabIndex={props.disabled ? -1 : 0} className="mobile-select-trigger" aria-label={props['aria-label'] ? title : undefined} aria-haspopup={isPhone() ? 'dialog' : 'listbox'} aria-controls={open ? menuId : undefined} aria-expanded={open} aria-disabled={props.disabled || undefined} onClick={event => { event.preventDefault(); if (open) close(); else show(event) }} onKeyDown={event => { if (!props.disabled && !open && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) show(event) }}><span>{selectedText}</span><ChevronDown size={16} aria-hidden="true" /></span>
    {open && (isPhone() ? createPortal(<div className="mobile-select-overlay" onPointerDown={event => { if (event.target === event.currentTarget) close() }}>
      <section ref={menuRef} className="mobile-select-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header><strong id={titleId}>{title}</strong><button type="button" aria-label="Đóng danh sách" onClick={() => close(true)}><X size={20} /></button></header>
        <div className="mobile-select-options" id={menuId} role="listbox" aria-label={title}>
          {optionsRef.current.map((option, index) => <button type="button" role="option" aria-selected={String(value ?? '') === option.value} disabled={option.disabled} key={`${option.value}-${index}`} onClick={() => choose(option)}>
            <span>{option.text}</span>{String(value ?? '') === option.value && <Check size={17} aria-hidden="true" className="mobile-select-check" />}
          </button>)}
        </div>
      </section>
    </div>, document.body) : createPortal(<div ref={menuRef} className="desktop-select-options" id={menuId} role="listbox" aria-label={title} style={{ left: position?.left, top: position?.top, width: position?.width, maxHeight: position?.maxHeight }}>
      {optionsRef.current.map((option, index) => <button type="button" role="option" data-active={active === index} aria-selected={String(value ?? '') === option.value} disabled={option.disabled} key={`${option.value}-${index}`} onPointerEnter={() => setActive(index)} onClick={() => choose(option)}>
        <span>{option.text}</span>{String(value ?? '') === option.value && <Check size={16} aria-hidden="true" />}
      </button>)}
    </div>, document.body))}
  </>
}