import { useCallback, useEffect, useState } from 'react'

export default function useDraftGuard(ref, dirty, pending) {
  const [discard, setDiscard] = useState(null)
  const request = useCallback(close => {
    if (pending) return
    if (dirty) setDiscard(() => close)
    else close()
  }, [dirty, pending])
  useEffect(() => {
    const guard = event => {
      if (!event.detail.element.contains(ref.current) || (!dirty && !pending)) return
      event.preventDefault(); request(event.detail.close)
    }
    const unload = event => { if (dirty || pending) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('customer-request-close', guard)
    window.addEventListener('beforeunload', unload)
    return () => { window.removeEventListener('customer-request-close', guard); window.removeEventListener('beforeunload', unload) }
  }, [ref, dirty, pending, request])
  return { request, discard, keep: () => setDiscard(null), confirm: () => { setDiscard(null); discard?.() } }
}