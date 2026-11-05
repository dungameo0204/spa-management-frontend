import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { executeTreatment, listResource } from '../api/resources'
import { canExecuteCard, treatmentCards } from '../utils/todayTreatments'
import { today } from '../utils/format'
import InvoiceChildStaffPicker from './InvoiceChildStaffPicker'
import MobileSelect from './MobileSelect'
import SignaturePad from './SignaturePad'
import ConfirmDialog from './ConfirmDialog'
import DateInput from './DateInput'

export default function TreatmentExecution({ card, user, branchId, onUpdated, onCancel, initialSelectedIds = [] }) {
  const manager = user?.system_role === 'MANAGER', grouped = Boolean(card.children?.length)
  const available = treatmentCards(card).filter(canExecuteCard)

  const initialSelected = {}
  if (grouped) {
    if (initialSelectedIds?.length > 0) {
      initialSelectedIds.forEach(id => {
        if (available.some(item => item.id === id)) initialSelected[id] = []
      })
    }
  } else if (available[0]) {
    initialSelected[available[0].id] = []
  }

  const [selected, setSelected] = useState(initialSelected)
  const [branch, setBranch] = useState(branchId || user?.branch_id || ''), [date, setDate] = useState(today())
  const [note, setNote] = useState(''), [signature, setSignature] = useState(null), [metadataOpen, setMetadataOpen] = useState(false)
  const [pending, setPending] = useState(false), [blocked, setBlocked] = useState(false), [message, setMessage] = useState(''), [confirm, setConfirm] = useState(false)
  const busy = useRef(false), qc = useQueryClient()
  const branches = useQuery({ queryKey: ['branches', 'treatment-picker'], queryFn: () => listResource('branches', {}, 1, 100).then(r => r ?? { data: [] }),  })
  const chosen = available.filter(item => Object.hasOwn(selected, item.id))

  async function submit(unsigned = false) {
    if (busy.current || blocked || !navigator.onLine) return
    if (!chosen.length || !branch || !date) { setMessage('Chọn dịch vụ, cơ sở và ngày thực hiện.'); return }
    if (new TextEncoder().encode(note).length > 65535) { setMessage('Ghi chú tối đa 65535 byte UTF-8.'); return }
    if (!signature && !unsigned) { setConfirm(true); return }
    busy.current = true; setPending(true); setConfirm(false); setMessage('')
    const done = []
    try {
      for (let i = 0; i < chosen.length; i++) {
        const item = chosen[i]
        const payload = {
          treatment_id: item.id,
          staffs: selected[item.id],
          ...(manager ? { branch_id: Number(branch) } : {}),
          execution_date: date,
          ...(note.trim() ? (i === 0 ? { note: note.trim() } : {}) : {}),
          ...(signature ? { customer_signature_svg: signature } : {}),
        }
        await executeTreatment(payload)
        done.push(item.product_name)
      }
      setBlocked(true)
      await onUpdated?.()
      onCancel?.()
    } catch (error) {
      setBlocked(true)
      setMessage(`${done.length ? `Đã ghi nhận: ${done.join(', ')}. ` : ''}${error.message}. Dừng gửi để tránh trừ buổi trùng. Kiểm tra lịch sử trước khi mở lại.`)
    } finally {
      await Promise.allSettled(['treatments', 'dashboard-treatments', 'appointments'].map(key => qc.invalidateQueries({ queryKey: [key] })))
      busy.current = false; setPending(false)
    }
  }

  return <div className={`treatment-execution-form ${grouped ? 'is-grouped-form' : 'is-single-form'}`}>
    <fieldset disabled={pending || blocked}>
      {grouped ? (
        <div className="treatment-execution-split">
          <div className="treatment-execution-left-col">
            {available.map(item => <div className="treatment-child-execution is-child" key={item.id}>
              <div className="treatment-child-execution-row">
                <label className="treatment-child-label">
                  <input
                    aria-label={item.product_name}
                    type="checkbox"
                    checked={Object.hasOwn(selected, item.id)}
                    onChange={event => setSelected(current => {
                      const next = { ...current };
                      if (event.target.checked) next[item.id] = [];
                      else delete next[item.id];
                      return next;
                    })}
                  />
                  <span className="treatment-child-name">{item.product_name}</span>
                </label>
                <span className="treatment-session-count">{item.remaining_sessions === null ? 'Trọn đời' : `${item.remaining_sessions}/${item.total_sessions} buổi`}</span>
                {Object.hasOwn(selected, item.id) ? (
                  <div className="treatment-child-staff-inline">
                    <InvoiceChildStaffPicker name={item.product_name} selected={selected[item.id]} onChange={staffs => setSelected(current => ({ ...current, [item.id]: staffs }))} branchId={branch || 'required'} />
                  </div>
                ) : (
                  <span className="treatment-child-staff-placeholder" aria-hidden="true" />
                )}
              </div>
            </div>)}
          </div>
          <div className="treatment-execution-right-col">
            <div className="treatment-execution-controls-row">
              <div className={`treatment-execution-manager-row${manager ? '' : ' no-branch'}`}>
                {manager && <label className="field compact-field branch-field"><span>Cơ sở thực hiện</span><MobileSelect aria-label="Cơ sở thực hiện" value={branch} onChange={event => { setBranch(event.target.value); setSelected(current => Object.fromEntries(Object.keys(current).map(id => [id, []]))) }}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</MobileSelect></label>}
                <label className="field compact-field date-field"><span>Ngày thực hiện</span><DateInput aria-label="Ngày thực hiện" required value={date} onChange={setDate} /></label>
              </div>
              <div className="treatment-session-tools">
                <button type="button" className={`session-followup-button${note.trim() ? ' has-value' : ''}`} onClick={() => setMetadataOpen(open => !open)}>{metadataOpen ? 'Ẩn ghi chú' : note.trim() ? 'Ghi chú ✓' : 'Ghi chú'}</button>
                <span className={`treatment-signature-state${signature ? ' has-value' : ''}`}>{signature ? 'Đã ký ✓' : 'Chưa ký'}</span>
                <div className="treatment-execution-signature"><SignaturePad customerName={card.customer_name} productName={card.product_name} disabled={pending || blocked} onChange={setSignature} /></div>
              </div>
            </div>
            {metadataOpen && <label className="field treatment-execution-note">Ghi chú buổi thực hiện<textarea rows={2} value={note} onChange={event => setNote(event.target.value)} placeholder="Lưu ý cho lần thực hiện này…" /></label>}
          </div>
        </div>
      ) : (
        /* Staff selection precedes the shared note/signature tools. */
        <div className="treatment-single-execution-row">
          <div className={`treatment-execution-manager-row is-single-manager${manager ? '' : ' no-branch'}`}>
            {manager && <label className="field compact-field branch-field"><span>Cơ sở thực hiện</span><MobileSelect aria-label="Cơ sở thực hiện" value={branch} onChange={event => { setBranch(event.target.value); setSelected(current => Object.fromEntries(Object.keys(current).map(id => [id, []]))) }}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</MobileSelect></label>}
            <label className="field compact-field date-field"><span>Ngày thực hiện</span><DateInput aria-label="Ngày thực hiện" required value={date} onChange={setDate} /></label>
          </div>
          {available[0] && Object.hasOwn(selected, available[0].id) && (
            <div className="treatment-single-staff">
              <InvoiceChildStaffPicker name={available[0].product_name} selected={selected[available[0].id]} onChange={staffs => setSelected({ [available[0].id]: staffs })} branchId={branch || 'required'} />
            </div>
          )}
        </div>
      )}

      {!grouped && <div className="treatment-session-tools">
        <button type="button" className={`session-followup-button${note.trim() ? ' has-value' : ''}`} onClick={() => setMetadataOpen(open => !open)}>{metadataOpen ? 'Ẩn ghi chú' : note.trim() ? 'Ghi chú ✓' : 'Ghi chú'}</button>
        <span className={`treatment-signature-state${signature ? ' has-value' : ''}`}>{signature ? 'Đã ký ✓' : 'Chưa ký'}</span>
        <div className="treatment-execution-signature"><SignaturePad customerName={card.customer_name} productName={card.product_name} disabled={pending || blocked} onChange={setSignature} /></div>
      </div>}
      {!grouped && metadataOpen && (
        <label className="field treatment-execution-note treatment-single-note">Ghi chú buổi thực hiện<textarea rows={2} value={note} onChange={event => setNote(event.target.value)} placeholder="Lưu ý cho lần thực hiện này…" /></label>
      )}
    </fieldset>

    {message && <p role="status" className="session-dialog-message">{message}</p>}
    <div className="treatment-execution-actions"><button type="button" className="btn secondary" disabled={pending} onClick={onCancel}>Đóng</button><button type="button" className="btn primary" disabled={pending || blocked || !chosen.length || !navigator.onLine} onClick={() => submit()}>{pending ? 'Đang ghi nhận...' : 'Xác nhận'}</button></div>
    {confirm && <ConfirmDialog title="Ghi nhận buổi chưa có chữ ký?" message="Bạn có chắc chắn muốn ghi nhận những dịch vụ đã chọn mà không có chữ ký khách hàng? Có thể ký bổ sung sau." cancelLabel="Quay lại ký" confirmLabel="Ghi nhận không có chữ ký" onCancel={() => setConfirm(false)} onConfirm={() => submit(true)} />}
  </div>
}
