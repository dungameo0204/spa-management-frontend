import { useCallback, useEffect, useRef, useState } from 'react'
import { getSkinImage } from '../api/resources'
import useDialogFocus from './useDialogFocus'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function SkinImageViewer({ customerId, selection, onClose }) {
  const [index, setIndex] = useState(selection.index), [zoom, setZoom] = useState(1), [offset, setOffset] = useState({ x: 0, y: 0 })
  const [source, setSource] = useState(''), [error, setError] = useState(''), [attempt, setAttempt] = useState(0)
  const ref = useRef(null), stageRef = useRef(null), drag = useRef(null)
  const touchRef = useRef(null), lastTapRef = useRef(0)
  const zoomRef = useRef(zoom), offsetRef = useRef(offset)
  zoomRef.current = zoom
  offsetRef.current = offset
  const image = selection.images[index], name = image.file?.name || image.original_filename || 'Ảnh da'
  useDialogFocus(ref, onClose)
  const navigate = useCallback(direction => {
    setIndex(current => Math.max(0, Math.min(selection.images.length - 1, current + direction)))
    setZoom(1); setOffset({ x: 0, y: 0 }); drag.current = null
  }, [selection.images.length])
  useEffect(() => {
    const key = event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1) }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [navigate])
  useEffect(() => {
    const controller = new AbortController()
    let alive = true, url
    setSource(''); setError('')
    Promise.resolve(image.file || getSkinImage(customerId, selection.sessionId, image.id, controller.signal)).then(blob => {
      if (alive) { url = URL.createObjectURL(blob); setSource(url) }
    }).catch(err => { if (alive && err.name !== 'AbortError') setError(err.message) })
    return () => { alive = false; controller.abort(); if (url) URL.revokeObjectURL(url) }
  }, [customerId, selection.sessionId, image, attempt])
  const changeZoom = value => { setZoom(Math.max(1, Math.min(4, value))); setOffset({ x: 0, y: 0 }) }
  useEffect(() => {
    const stage = stageRef.current
    const wheel = event => {
      event.preventDefault()
      if (!source || error || !event.deltaY) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1)
      const next = Math.max(1, Math.min(4, zoom * Math.exp(-Math.max(-100, Math.min(100, delta)) * .002)))
      const bounds = stage.getBoundingClientRect()
      const x = event.clientX - bounds.left - bounds.width / 2, y = event.clientY - bounds.top - bounds.height / 2
      const ratio = next / zoom
      setOffset(next === 1 ? { x: 0, y: 0 } : { x: x - (x - offset.x) * ratio, y: y - (y - offset.y) * ratio })
      setZoom(next)
    }
    stage.addEventListener('wheel', wheel, { passive: false })
    return () => stage.removeEventListener('wheel', wheel)
  }, [zoom, offset, source, error])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onTouchStart = event => {
      if (!source || error) return
      if (event.touches.length === 2) {
        event.preventDefault()
        const t1 = event.touches[0], t2 = event.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const midX = (t1.clientX + t2.clientX) / 2
        const midY = (t1.clientY + t2.clientY) / 2
        touchRef.current = {
          mode: 'pinch',
          startDist: dist,
          midX,
          midY,
          startZoom: zoomRef.current,
          startOffset: { ...offsetRef.current },
        }
      } else if (event.touches.length === 1) {
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
          event.preventDefault()
          changeZoom(zoomRef.current > 1 ? 1 : 2)
          lastTapRef.current = 0
          touchRef.current = null
          return
        }
        lastTapRef.current = now

        if (zoomRef.current > 1) {
          const t = event.touches[0]
          touchRef.current = {
            mode: 'pan',
            startX: t.clientX,
            startY: t.clientY,
            startOffset: { ...offsetRef.current },
          }
        }
      }
    }

    const onTouchMove = event => {
      if (!touchRef.current || !source || error) return
      if (touchRef.current.mode === 'pinch' && event.touches.length === 2) {
        event.preventDefault()
        const t1 = event.touches[0], t2 = event.touches[1]
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        if (touchRef.current.startDist > 0) {
          const scale = currentDist / touchRef.current.startDist
          const next = Math.max(1, Math.min(4, touchRef.current.startZoom * scale))
          const bounds = stage.getBoundingClientRect()
          const x = touchRef.current.midX - bounds.left - bounds.width / 2
          const y = touchRef.current.midY - bounds.top - bounds.height / 2
          const ratio = next / touchRef.current.startZoom
          const currentMidX = (t1.clientX + t2.clientX) / 2
          const currentMidY = (t1.clientY + t2.clientY) / 2
          const panX = currentMidX - touchRef.current.midX
          const panY = currentMidY - touchRef.current.midY

          setOffset(next === 1 ? { x: 0, y: 0 } : {
            x: x - (x - touchRef.current.startOffset.x) * ratio + panX,
            y: y - (y - touchRef.current.startOffset.y) * ratio + panY,
          })
          setZoom(next)
        }
      } else if (touchRef.current.mode === 'pan' && event.touches.length === 1 && zoomRef.current > 1) {
        event.preventDefault()
        const t = event.touches[0]
        const dx = t.clientX - touchRef.current.startX
        const dy = t.clientY - touchRef.current.startY
        setOffset({
          x: touchRef.current.startOffset.x + dx,
          y: touchRef.current.startOffset.y + dy,
        })
      }
    }

    const onTouchEnd = event => {
      if (!touchRef.current) return
      if (event.touches.length === 0) {
        touchRef.current = null
      } else if (event.touches.length === 1 && zoomRef.current > 1) {
        const t = event.touches[0]
        touchRef.current = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          startOffset: { ...offsetRef.current },
        }
      }
    }

    stage.addEventListener('touchstart', onTouchStart, { passive: false })
    stage.addEventListener('touchmove', onTouchMove, { passive: false })
    stage.addEventListener('touchend', onTouchEnd)
    stage.addEventListener('touchcancel', onTouchEnd)

    return () => {
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      stage.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [source, error])
  return <div ref={ref} className="skin-viewer" role="dialog" aria-modal="true" aria-label="Xem ảnh da">
    <div className="skin-viewer-toolbar"><button type="button" className="btn secondary" onClick={onClose}>Đóng ảnh</button><div className="skin-viewer-zoom"><button type="button" aria-label="Thu nhỏ" disabled={zoom <= 1} onClick={() => changeZoom(zoom - .25)}>−</button><output aria-label="Mức phóng đại">{Math.round(zoom * 100)}%</output><button type="button" aria-label="Phóng to" disabled={zoom >= 4} onClick={() => changeZoom(zoom + .25)}>+</button><button type="button" onClick={() => changeZoom(1)}>Vừa màn hình</button></div></div>
    <div ref={stageRef} className={`skin-viewer-stage ${zoom > 1 ? 'is-zoomed' : ''}`} title="Lăn chuột để phóng to / thu nhỏ · Kéo để di chuyển ảnh" onDoubleClick={() => changeZoom(zoom > 1 ? 1 : 2)} onPointerDown={event => {
      if (zoom <= 1 || !source) return
      drag.current = { x: event.clientX - offset.x, y: event.clientY - offset.y }
      event.currentTarget.setPointerCapture(event.pointerId)
    }} onPointerMove={event => { if (drag.current) setOffset({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y }) }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
      {error ? <div role="alert">Không tải được ảnh: {error}<button type="button" className="btn secondary" onClick={() => setAttempt(value => value + 1)}>Thử lại ảnh</button></div> : source ? <img src={source} alt={name} draggable={false} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} onError={() => setError('Ảnh hỏng hoặc không đọc được')} /> : <p role="status">Đang tải ảnh…</p>}
    </div>
    <div className="skin-viewer-navigation"><button type="button" className="btn secondary skin-viewer-arrow" aria-label="Ảnh trước" disabled={index === 0} onClick={() => navigate(-1)}><ChevronLeft size={24} aria-hidden="true" /></button><span aria-live="polite">{index + 1} / {selection.images.length}</span><button type="button" className="btn secondary skin-viewer-arrow" aria-label="Ảnh tiếp theo" disabled={index === selection.images.length - 1} onClick={() => navigate(1)}><ChevronRight size={24} aria-hidden="true" /></button></div>
  </div>
}