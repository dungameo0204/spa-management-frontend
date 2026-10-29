import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { executeTreatment, listResource, updateTreatmentGroupNote } from '../api/resources'
import { canExecuteCard, treatmentCards } from '../utils/todayTreatments'
import { today } from '../utils/format'
import RoleStaffPicker from './RoleStaffPicker'
import MobileSelect from './MobileSelect'
import SignaturePad from './SignaturePad'
import ConfirmDialog from './ConfirmDialog'

export default function TreatmentExecution({ card, user, branchId, onUpdated, onCancel }) {
  const manager = user.system_role === 'MANAGER', grouped = Boolean(card.children?.length)
  const available = treatmentCards(card).filter(canExecuteCard)
  const [selected, setSelected] = useState(grouped ? {} : { [card.id]: [] })
  const [branch, setBranch] = useState(branchId || user.branch_id || ''), [date, setDate] = useState(today())
  const [note, setNote] = useState(grouped ? card.note || '' : ''), [signature, setSignature] = useState(null)
  const [pending, setPending] = useState(false), [blocked, setBlocked] = useState(false), [message, setMessage] = useState(''), [confirm, setConfirm] = useState(false)
  const busy = useRef(false), qc = useQueryClient()
  const branches = useQuery({ queryKey: ['branches', 'treatment-picker'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const chosen = available.filter(item => Object.hasOwn(selected, item.id))
  async function submit(unsigned = false) {
    if (busy.current || blocked || !navigator.onLine) return
    if (!chosen.length || !branch || !date) { setMessage('Chọn dịch vụ, cơ sở và ngày thực hiện.'); return }
    if (chosen.some(item => !selected[item.id]?.length)) { setMessage('Chọn nhân viên cho từng dịch vụ thực hiện.'); return }
    if (new TextEncoder().encode(note).length > 65535) { setMessage('Ghi chú tối đa 65535 byte UTF-8.'); return }
    if (!signature && !unsigned) { setConfirm(true); return }
    busy.current = true; setPending(true); setConfirm(false); setMessage('')
    const done = []
    try {
      for (const item of chosen) {
        await executeTreatment({ treatment_id: item.id, staffs: selected[item.id], ...(manager ? { branch_id: Number(branch), execution_date: date } : {}), ...(!grouped ? { note: note.trim() || null } : {}), ...(signature ? { customer_signature_svg: signature } : {}) })
        done.push(item.product_name)
      }
      if (grouped && (note.trim() || null) !== (card.note?.trim() || null)) await updateTreatmentGroupNote(card.id, note.trim() || null)
      setBlocked(true)
      setMessage(`Đã ghi nhận ${done.length} dịch vụ. Không xác nhận lại.`)
      await onUpdated?.()
    } catch (error) {
      setBlocked(true)
      setMessage(`${done.length ? `Đã ghi nhận: ${done.join(', ')}. ` : ''}${error.message}. Dừng gửi để tránh trừ buổi trùng. Kiểm tra lịch sử trước khi mở lại; ghi chú chung có thể chưa được lưu.`)
    } finally {
      await Promise.allSettled(['treatments', 'dashboard-treatments', 'appointments'].map(key => qc.invalidateQueries({ queryKey: [key] })))
      busy.current = false; setPending(false)
    }
  }
  return <div className="treatment-execution-form">
    <fieldset disabled={pending || blocked}>
      {manager && <><label className="field">Cơ sở thực hiện<MobileSelect value={branch} onChange={event => { setBranch(event.target.value); setSelected(current => Object.fromEntries(Object.keys(current).map(id => [id, []]))) }}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</MobileSelect></label><label className="field">Ngày thực hiện<input type="date" required value={date} onChange={event => setDate(event.target.value)} /></label></>}
      {available.map(item => <div className="treatment-child-execution" key={item.id}>
        {grouped && <label><input type="checkbox" checked={Object.hasOwn(selected, item.id)} onChange={event => setSelected(current => { const next = { ...current }; if (event.target.checked) next[item.id] = []; else delete next[item.id]; return next })} /> {item.product_name}</label>}
        {Object.hasOwn(selected, item.id) && <RoleStaffPicker label={`Nhân viên ${item.product_name}`} selected={selected[item.id]} onChange={staffs => setSelected(current => ({ ...current, [item.id]: staffs }))} branchId={branch || 'required'} />}
      </div>)}
      <label className="field">{grouped ? 'Ghi chú chung liệu trình' : 'Ghi chú buổi thực hiện'}<textarea rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
      <SignaturePad customerName={card.customer_name} productName={card.product_name} disabled={pending || blocked} onChange={setSignature} />
      {grouped && <p className="small-muted">Một chữ ký xác nhận các dịch vụ được chọn. Ghi chú chung lưu trên thẻ cha, không sao chép vào lịch sử con.</p>}
    </fieldset>
    {message && <p role="status" className="session-dialog-message">{message}</p>}
    <div className="drawer-actions"><button className="btn secondary" disabled={pending} onClick={onCancel}>Đóng thực hiện</button><button className="btn primary" disabled={pending || blocked || !chosen.length || !navigator.onLine} onClick={() => submit()}>{pending ? 'Đang ghi nhận...' : 'Xác nhận thực hiện'}</button></div>
    {confirm && <ConfirmDialog title="Ghi nhận buổi chưa có chữ ký?" message="Bạn có chắc chắn muốn ghi nhận những dịch vụ đã chọn mà không có chữ ký khách hàng? Có thể ký bổ sung sau." cancelLabel="Quay lại ký" confirmLabel="Ghi nhận không có chữ ký" onCancel={() => setConfirm(false)} onConfirm={() => submit(true)} />}
  </div>
}