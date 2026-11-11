import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useDialogFocus from './useDialogFocus'
import CustomerRecordPrint from './CustomerRecordPrint'
import recordStyles from './CustomerRecordPrint.css?raw'
import './CustomerRecordShare.css'

// Only the record stylesheet belongs in the capture. App themes may contain
// modern color functions which html2canvas 1.4 cannot parse.
function prepareCapture(document) {
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => node.remove())
  const style = document.createElement('style')
  style.textContent = `html,body{margin:0;background:#fff;color:#111;color-scheme:light}*{box-sizing:border-box}${recordStyles}#customer-record-share{position:absolute;left:0;top:0}`
  document.head.append(style)
}

const safeFilename = value => String(value || 'khach-hang').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'khach-hang'

function download(file) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

async function waitForImages(element) {
  await Promise.all([...element.querySelectorAll('img')].map(image => {
    if (image.complete) return Promise.resolve()
    return new Promise(resolve => {
      const done = () => {
        clearTimeout(timer)
        image.removeEventListener('load', done); image.removeEventListener('error', done)
        resolve()
      }
      const timer = setTimeout(done, 2000)
      image.addEventListener('load', done, { once: true }); image.addEventListener('error', done, { once: true })
    })
  }))
}

// SVGs without explicit dimensions can have different intrinsic sizes when
// html2canvas reloads them. Rasterize the whole SVG viewport first, rather than
// relying on html2canvas's unsupported object-fit handling.
export async function prepareSignatures(root) {
  for (const image of root.querySelectorAll('.customer-record-signature-image')) {
    const svg = new DOMParser().parseFromString(decodeURIComponent(image.src.split(',')[1]), 'image/svg+xml').documentElement
    if (svg.localName !== 'svg' || svg.querySelector('parsererror')) throw new Error('Chữ ký không hợp lệ.')
    const bounds = image.getBoundingClientRect()
    const width = Math.max(1, Math.round(bounds.width * 2)), height = Math.max(1, Math.round(bounds.height * 2))
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    const source = new Image()
    const loaded = new Promise((resolve, reject) => {
      source.onload = resolve
      source.onerror = () => reject(new Error('Không thể đọc chữ ký.'))
    })
    source.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
    await loaded
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể tạo ảnh chữ ký.')
    context.drawImage(source, 0, 0, width, height)
    image.src = canvas.toDataURL('image/png')
  }
  await waitForImages(root)
}

function ShareDialog({ files, title, onClose }) {
  const ref = useRef(null)
  const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false)
  const [previews, setPreviews] = useState([])
  useEffect(() => {
    const layer = ref.current.parentElement
    const siblings = [...document.body.children].filter(element => element !== layer).map(element => [element, element.inert])
    const overflow = document.body.style.overflow
    siblings.forEach(([element]) => { element.inert = true })
    document.body.style.overflow = 'hidden'
    return () => {
      siblings.forEach(([element, inert]) => { element.inert = inert })
      document.body.style.overflow = overflow
    }
  }, [])
  useDialogFocus(ref, onClose)
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [files])
  const data = { title, files }
  let canShare = false
  try { canShare = typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare({ files })) } catch { /* Unsupported file sharing. */ }
  const canCopy = typeof navigator.clipboard?.write === 'function' && typeof ClipboardItem !== 'undefined'
  const share = async () => {
    setBusy(true); setNotice(''); setFailed(false)
    try {
      // Call directly in the click handler: capture has already finished.
      await navigator.share(data)
      setNotice('Đã chuyển yêu cầu cho hệ thống, chưa xác nhận đã gửi. Nếu ứng dụng không mở, hãy sao chép hoặc tải ảnh bên dưới.')
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setFailed(true); setNotice('Không thể chia sẻ trực tiếp. Bạn có thể sao chép từng ảnh hoặc tải ảnh để gửi thủ công.')
      }
    } finally { setBusy(false) }
  }
  const copy = async (file, index) => {
    setBusy(true); setNotice(''); setFailed(false)
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })])
      setNotice(`Đã sao chép trang ${index + 1}. Mở cuộc trò chuyện trong Discord, Zalo hoặc ứng dụng nhận ảnh rồi nhấn Ctrl+V để dán.`)
    } catch {
      setFailed(true); setNotice('Không thể sao chép ảnh trên trình duyệt này. Hãy tải ảnh để đính kèm vào cuộc trò chuyện.')
    } finally { setBusy(false) }
  }
  return createPortal(<div className="customer-record-share-layer"><section ref={ref} className="customer-record-share-dialog" role="dialog" aria-modal="true" aria-labelledby="record-share-title" aria-describedby="record-share-help">
    <header><h2 id="record-share-title">Chia sẻ hồ sơ khách hàng</h2><button type="button" className="btn secondary" onClick={onClose}>Đóng</button></header>
    <div className="customer-record-share-actions"><button type="button" className="btn" disabled={!canShare || busy} onClick={share}>{busy ? 'Đang xử lý…' : 'Gửi qua ứng dụng'}</button><button type="button" className="btn secondary" onClick={() => { files.forEach(download); setFailed(false); setNotice(`Đã yêu cầu tải ${files.length} ảnh PNG. Kiểm tra mục tải xuống của trình duyệt.`) }}>Tải tất cả ảnh</button></div>
    {!canShare && <p>Thiết bị này không hỗ trợ chia sẻ tệp trực tiếp. Hãy sao chép hoặc tải ảnh bên dưới.</p>}
    {!canCopy && <p>Trình duyệt này không hỗ trợ sao chép ảnh. Bạn vẫn có thể tải ảnh để gửi.</p>}
    {notice && <p role={failed ? 'alert' : 'status'}>{notice}</p>}
    <div className="customer-record-share-previews">{files.map((file, index) => <figure key={file.name}>
      {previews[index] && <img src={previews[index]} alt={`Xem trước hồ sơ trang ${index + 1}`} />}
      <figcaption>Trang {index + 1}</figcaption><div className="customer-record-share-actions"><button type="button" className="btn secondary" disabled={!canCopy || busy} onClick={() => copy(file, index)}>Sao chép ảnh trang {index + 1}</button><button type="button" className="btn secondary" onClick={() => download(file)}>Tải trang {index + 1}</button></div>
    </figure>)}</div>
  </section></div>, document.body)
}

export default function CustomerRecordShare({ record, onDone, onMessage }) {
  const [prepared, setPrepared] = useState(null)
  const callbacks = useRef({ onDone, onMessage })
  useEffect(() => { callbacks.current = { onDone, onMessage } }, [onDone, onMessage])
  useEffect(() => {
    if (!record) return
    let cancelled = false
    async function createImages() {
      try {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        if (cancelled) return
        const root = document.querySelector('#customer-record-share')
        if (!root) throw new Error('Không tìm thấy nội dung hồ sơ để xuất ảnh.')
        await waitForImages(root)
        await prepareSignatures(root)
        await document.fonts?.ready
        if (cancelled) return
        const html2canvas = (await import('html2canvas')).default
        const pages = [...root.querySelectorAll('.customer-record-page')]
        const baseName = safeFilename(record.customer.fullname || record.customer.profile_code)
        const files = []
        for (const [index, page] of pages.entries()) {
          if (cancelled) return
          const canvas = await html2canvas(page, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, onclone: prepareCapture })
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
          if (!blob) throw new Error(`Không thể tạo ảnh trang ${index + 1}.`)
          files.push(new File([blob], `ho-so-${baseName}-trang-${index + 1}.png`, { type: 'image/png' }))
        }
        if (cancelled) return
        setPrepared({ record, files })
      } catch (error) {
        if (!cancelled) {
          callbacks.current.onMessage(`Không thể tạo ảnh hồ sơ: ${error.message}`, 'error')
          callbacks.current.onDone()
        }
      }
    }
    createImages()
    return () => { cancelled = true }
  }, [record])

  if (!record) return null
  if (prepared?.record === record) return <ShareDialog files={prepared.files} title={`Hồ sơ khách hàng ${record.customer.fullname || ''}`.trim()} onClose={() => callbacks.current.onDone()} />
  return <CustomerRecordPrint record={record} mode="share" />
}