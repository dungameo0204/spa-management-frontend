import { useState } from 'react'
import { Pencil } from 'lucide-react'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'

export default function TreatmentGroupSignature({ card, history, sessions, user, onUpdated }) {
  const [open, setOpen] = useState(false)
  const signed = Boolean(history?.customer_signature_svg || history?.customer_signed_at)
  const preview = history?.customer_signature_svg
  return <><div className="today-session-signatures"><div className="today-signature-preview">{preview && <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview)}`} alt={`Chữ ký nhóm ${card.product_name}`} />}<small>{signed ? 'Đã ký' : 'Chưa ký'}</small></div><button type="button" className="session-followup-button" onClick={() => setOpen(true)} aria-label={`Ghi chú và chữ ký nhóm ${card.product_name}`}><Pencil size={12} aria-hidden="true" />{signed ? 'Ghi chú / Xem' : 'Ghi chú / Ký'}</button></div>{open && <TreatmentGroupSessionDialog card={card} history={history} sessions={sessions} user={user} onClose={() => setOpen(false)} onUpdated={onUpdated} />}</>
}