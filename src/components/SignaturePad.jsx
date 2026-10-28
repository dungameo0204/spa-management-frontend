import { useRef, useState } from 'react'

export default function SignaturePad({ onChange, disabled = false }) {
  const [paths, setPaths] = useState([])
  const stroke = useRef(null)
  const point = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    return `${Math.max(0, Math.min(600, (event.clientX - rect.left) * 600 / rect.width)).toFixed(1)} ${Math.max(0, Math.min(180, (event.clientY - rect.top) * 180 / rect.height)).toFixed(1)}`
  }
  const finish = event => {
    if (stroke.current?.pointerId !== event.pointerId) return
    stroke.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const clear = () => { stroke.current = null; setPaths([]); onChange(null) }
  return <div className="session-signature">
    <span className="field-label">Chữ ký khách hàng</span>
    <p className="small-muted">Dùng chuột hoặc chạm và kéo để ký bên dưới.</p>
    <svg className="signature-pad" role="img" aria-label="Vùng ký tên khách hàng" viewBox="0 0 600 180" preserveAspectRatio="none"
      onPointerDown={event => {
        if (disabled || stroke.current || event.button !== 0 || paths.length >= 1000) return
        event.preventDefault()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        stroke.current = { pointerId: event.pointerId, start: point(event), path: null }
      }}
      onPointerMove={event => {
        if (disabled || stroke.current?.pointerId !== event.pointerId) return
        const current = stroke.current, next = point(event)
        if (!current.path && next === current.start) return
        const path = current.path ? `${current.path} L ${next}` : `M ${current.start} L ${next}`
        const updated = current.path ? [...paths.slice(0, -1), path] : [...paths, path]
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 180" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${updated.map(d => `<path d="${d}"/>`).join('')}</svg>`
        if (svg.length > 128 * 1024 || path.length > 100000) return
        current.path = path
        setPaths(updated)
        onChange(svg)
      }}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={() => { stroke.current = null }}>
      {paths.map((d, index) => <path key={index} d={d} fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
    <button className="btn secondary" type="button" disabled={disabled || !paths.length} onClick={clear}>Xóa chữ ký / Ký lại</button>
  </div>
}