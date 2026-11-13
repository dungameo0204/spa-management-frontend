import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import html2canvas from 'html2canvas'
import CustomerRecordShare, { prepareSignatures } from './CustomerRecordShare'

vi.mock('html2canvas', () => ({ default: vi.fn(async () => ({ toBlob: (cb, type) => cb(new Blob(['jpeg'], { type })) })) }))
vi.mock('./CustomerRecordPrint.css?raw', async () => ({ default: (await import('node:fs')).readFileSync(`${process.cwd()}/src/components/CustomerRecordPrint.css`, 'utf8') }))
const record = { customer: { id: 1, fullname: 'Nguyễn An', referral_sources: [] }, timeline: [], treatments: [] }
beforeEach(() => {
  html2canvas.mockClear()
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:record'), revokeObjectURL: vi.fn() })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); delete navigator.share; delete navigator.canShare; delete navigator.clipboard })
const open = async () => {
  const done = vi.fn(), message = vi.fn()
  const view = render(<CustomerRecordShare record={record} onDone={done} onMessage={message} />)
  await screen.findByRole('dialog')
  return { done, message, ...view }
}
it('prepares previews without sharing or downloading until clicked', async () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const { done } = await open()
  expect(html2canvas).toHaveBeenCalledTimes(3)
  expect(html2canvas.mock.results.every(({ value }) => value instanceof Promise)).toBe(true)
  expect(click).not.toHaveBeenCalled()
  expect(await screen.findAllByAltText(/Xem trước hồ sơ trang/)).toHaveLength(3)
  expect(document.querySelector('#record-share-help')).toHaveTextContent('Tổng dung lượng 1 KB.')
  expect(screen.getByRole('button', { name: 'Gửi 3 ảnh qua ứng dụng' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Tải tất cả ảnh' }))
  expect(click).toHaveBeenCalledTimes(3)
  expect(done).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Đóng', exact: true }))
  expect(done).toHaveBeenCalledOnce()
})
it('shares directly from a new click and keeps previews after handoff', async () => {
  navigator.share = vi.fn().mockResolvedValue(undefined)
  navigator.canShare = () => true
  const { done } = await open()
  expect(navigator.share).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Gửi 3 ảnh qua ứng dụng' }))
  expect(navigator.share).toHaveBeenCalledWith(expect.objectContaining({ files: expect.arrayContaining([expect.any(File)]) }))
  const sharedFiles = navigator.share.mock.calls[0][0].files
  expect(sharedFiles).toHaveLength(3)
  expect(sharedFiles.map(file => file.name)).toEqual(['ho-so-nguyen-an-trang-1.jpg', 'ho-so-nguyen-an-trang-2.jpg', 'ho-so-nguyen-an-trang-3.jpg'])
  expect(sharedFiles.every(file => file.type === 'image/jpeg' && file.size > 0)).toBe(true)
  await screen.findByText(/Đã chuyển đủ 3 ảnh/)
  expect(done).not.toHaveBeenCalled()
})
it.each(['AbortError', 'NotAllowedError'])('keeps previews without downloading on %s', async name => {
  navigator.share = vi.fn().mockRejectedValue(new DOMException('failed', name))
  navigator.canShare = () => true
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const { done } = await open()
  fireEvent.click(screen.getByRole('button', { name: 'Gửi 3 ảnh qua ứng dụng' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi 3 ảnh qua ứng dụng' })).toBeEnabled())
  expect(click).not.toHaveBeenCalled()
  expect(done).not.toHaveBeenCalled()
  if (name === 'NotAllowedError') expect(screen.getByRole('alert')).toHaveTextContent('Không thể chia sẻ trực tiếp')
  else expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
it('copies the selected JPEG page', async () => {
  vi.stubGlobal('ClipboardItem', class { constructor(data) { this.data = data } })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write: vi.fn().mockResolvedValue(undefined) } })
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Sao chép ảnh trang 2' }))
  await screen.findByText(/Đã sao chép trang 2/)
  expect(navigator.clipboard.write.mock.calls[0][0][0].data['image/jpeg'].name).toContain('trang-2.jpg')
})
it('handles clipboard denial without losing download options', async () => {
  vi.stubGlobal('ClipboardItem', class {})
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write: vi.fn().mockRejectedValue(new Error('denied')) } })
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Sao chép ảnh trang 1' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể sao chép ảnh')
  expect(screen.getByRole('button', { name: 'Tải tất cả ảnh' })).toBeEnabled()
})
it('isolates OKLCH styles, never prints and revokes preview URLs', async () => {
  const print = vi.spyOn(window, 'print').mockImplementation(() => {})
  const { unmount } = await open()
  const clone = document.implementation.createHTMLDocument()
  clone.head.innerHTML = '<style>body{color:oklch(90% .1 100)}</style><link rel="stylesheet" href="/theme.css">'
  html2canvas.mock.calls[0][1].onclone(clone)
  expect(clone.querySelector('link')).toBeNull()
  expect(clone.head.textContent).not.toContain('oklch')
  expect(clone.head.textContent).toContain('left:-10000px')
  expect(print).not.toHaveBeenCalled()
  unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3)
})
it('reports capture errors and clears the preparing state', async () => {
  html2canvas.mockRejectedValueOnce(new Error('Canvas failed'))
  const message = vi.fn(), done = vi.fn()
  render(<CustomerRecordShare record={record} onMessage={message} onDone={done} />)
  await waitFor(() => expect(done).toHaveBeenCalledOnce())
  expect(message).toHaveBeenCalledWith('Không thể tạo ảnh hồ sơ: Canvas failed', 'error')
})
it('rasterizes the entire SVG viewBox at explicit dimensions', async () => {
  let source
  vi.stubGlobal('Image', class { set src(value) { source = value; queueMicrotask(() => this.onload()) } })
  const drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage })
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,cG5n')
  const root = document.createElement('div')
  root.innerHTML = '<img class="customer-record-signature-image">'
  const image = root.firstChild
  image.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 40 400 80"><path d="M 100 40 L 500 120"/></svg>')}`
  vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({ width: 120, height: 30 })
  await prepareSignatures(root)
  const svg = decodeURIComponent(source.split(',')[1])
  expect(svg).toContain('viewBox="100 40 400 80"')
  expect(svg).toContain('width="240"')
  expect(svg).toContain('height="60"')
  expect(svg).toContain('preserveAspectRatio="xMidYMid meet"')
  expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 240, 60)
  expect(image.src).toBe('data:image/png;base64,cG5n')
})