import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import useDialogFocus from './useDialogFocus'

const serialize = (paths, size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths.map(d => `<path d="${d}"/>`).join('')}</svg>`

function exportSignature(paths, size) {
  // These paths are generated locally using only M/L coordinate pairs.
  // Crop the viewport, not the strokes, so small signatures remain legible in previews.
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
  for (const path of paths) {
    for (const match of path.matchAll(/([\d.]+) ([\d.]+)/g)) {
      const x = Number(match[1]), y = Number(match[2])
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
  }
  if (!Number.isFinite(left)) return serialize(paths, size)
  const padding = 8
  const viewBox = [left - padding, top - padding, right - left + padding * 2, bottom - top + padding * 2].map(value => Number(value.toFixed(1))).join(' ')
  return serialize(paths, size).replace(`viewBox="0 0 ${size.width} ${size.height}"`, `viewBox="${viewBox}"`)
}

export default function SignatureDialog({ customerName, productName, onClose, onConfirm }) {
  const [paths, setPaths] = useState([]), [discard, setDiscard] = useState(false), [message, setMessage] = useState('')
  const [size, setSize] = useState({ width: 600, height: 360 })
  const ref = useRef(null), pad = useRef(null), stroke = useRef(null), pathsRef = useRef([]), id = useId()
  const close = () => { if (pathsRef.current.length) setDiscard(true); else onClose() }
  useLayoutEffect(() => {
    const rect = pad.current.getBoundingClientRect()
    if (rect.width && rect.height) setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
  }, [])
  useEffect(() => {
    const layer = ref.current.parentElement, body = document.body, html = document.documentElement
    const x = window.scrollX, y = window.scrollY
    const oldBody = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow }
    const oldOverflow = html.style.overflow
    const siblings = [...body.children].filter(element => element !== layer).map(element => [element, element.inert])
    siblings.forEach(([element]) => { element.inert = true })
    Object.assign(body.style, { position: 'fixed', top: `${-y}px`, left: `${-x}px`, width: '100%', overflow: 'hidden' })
    html.style.overflow = 'hidden'
    return () => {
      siblings.forEach(([element, inert]) => { element.inert = inert })
      Object.assign(body.style, oldBody); html.style.overflow = oldOverflow
      if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y)
    }
  }, [])
  // Restore background interactivity before the focus hook returns focus to its trigger.
  useDialogFocus(ref, close)
  const point = event => {
    const rect = pad.current.getBoundingClientRect()
    const scale = Math.min(rect.width / size.width, rect.height / size.height)
    if (!scale) return null
    const x = (event.clientX - rect.left - (rect.width - size.width * scale) / 2) / scale
    const y = (event.clientY - rect.top - (rect.height - size.height * scale) / 2) / scale
    return `${Math.max(0, Math.min(size.width, x)).toFixed(1)} ${Math.max(0, Math.min(size.height, y)).toFixed(1)}`
  }
  const finish = event => {
    if (stroke.current?.pointerId !== event.pointerId) return
    stroke.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const clear = () => { stroke.current = null; pathsRef.current = []; setPaths([]); setMessage(''); setDiscard(false) }
  return <div className="signature-dialog-layer"><section ref={ref} className="signature-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`}>
    <header className="signature-dialog-header"><div><h2 id={`${id}-title`}>Chữ ký khách hàng</h2>{(customerName || productName) && <p>{[customerName, productName].filter(Boolean).join(' · ')}</p>}</div><button type="button" className="btn secondary" onClick={close}>Đóng vùng ký</button></header>
    <p id={`${id}-help`} className="signature-dialog-help">Ký tên trong khung bên dưới. Chữ ký chỉ được lưu khi xác nhận buổi.</p>
    <div className="signature-dialog-stage"><svg ref={pad} className="signature-dialog-pad" role="img" aria-label="Vùng ký tên khách hàng" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="xMidYMid meet"
      onPointerDown={event => {
        if (discard || stroke.current || event.button !== 0 || pathsRef.current.length >= 1000) return
        event.preventDefault()
        const start = point(event)
        if (!start) return
        event.currentTarget.setPointerCapture?.(event.pointerId)
        stroke.current = { pointerId: event.pointerId, start, path: null }
      }}
      onPointerMove={event => {
        if (stroke.current?.pointerId !== event.pointerId) return
        const current = stroke.current, next = point(event)
        if (!next || (!current.path && next === current.start)) return
        const path = current.path ? `${current.path} L ${next}` : `M ${current.start} L ${next}`
        const updated = current.path ? [...pathsRef.current.slice(0, -1), path] : [...pathsRef.current, path]
        if (serialize(updated, size).length > 128 * 1024 || path.length > 100000) { setMessage('Chữ ký quá dài. Vui lòng xóa và ký ngắn gọn hơn.'); return }
        current.path = path; pathsRef.current = updated; setPaths(updated)
      }}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={() => { stroke.current = null }}>
      {paths.map((d, index) => <path key={index} d={d} fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg></div>
    {message && <p role="status" className="signature-dialog-help">{message}</p>}
    {discard ? <div className="signature-discard" role="group" aria-label="Bỏ chữ ký đang vẽ?"><p>Bỏ chữ ký đang vẽ? Chữ ký đã chọn trước đó vẫn được giữ nguyên.</p><div className="signature-dialog-actions"><button type="button" className="btn secondary" autoFocus onClick={() => setDiscard(false)}>Tiếp tục ký</button><button type="button" className="btn danger" onClick={onClose}>Bỏ bản nháp</button></div></div> : <footer className="signature-dialog-actions"><button className="btn secondary" type="button" disabled={!paths.length} onClick={clear}>Xóa chữ ký / Ký lại</button><button className="btn primary" type="button" disabled={!paths.length} onClick={() => onConfirm(exportSignature(pathsRef.current, size))}>Dùng chữ ký này</button></footer>}
  </section></div>
}