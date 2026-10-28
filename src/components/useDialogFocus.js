import { useEffect, useRef } from 'react'

export default function useDialogFocus(ref, onClose) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement, element = ref.current
    const controls = () => [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(control => control.getClientRects().length)
    controls()[0]?.focus()
    const key = event => {
      if ([...document.querySelectorAll('[aria-modal="true"]')].at(-1) !== element) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current() }
      if (event.key === 'Tab') {
        const items = controls(), first = items[0], last = items.at(-1)
        if (!items.length) { event.preventDefault(); return }
        if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key, true)
    return () => { document.removeEventListener('keydown', key, true); if (previous?.isConnected) previous.focus() }
  }, [ref])
}