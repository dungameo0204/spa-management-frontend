import { useEffect } from 'react'

export default function ErrorAlertFocus() {
  useEffect(() => {
    const seen = new WeakMap()
    const highlight = () => {
      document.querySelectorAll('.form-alert').forEach(alert => {
        const text = alert.textContent?.trim()
        if (!text || seen.get(alert) === text) return
        seen.set(alert, text)
        alert.setAttribute('role', 'alert')
        alert.setAttribute('tabindex', '-1')
        alert.classList.remove('alert-attention')
        void alert.offsetWidth
        alert.classList.add('alert-attention')
        alert.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' })
      })
    }
    const observer = new MutationObserver(highlight)
    observer.observe(document.body, { childList: true, characterData: true, subtree: true })
    highlight()
    return () => observer.disconnect()
  }, [])
  return null
}