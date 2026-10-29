import { useState } from 'react'
import { Pencil } from 'lucide-react'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'

export default function TreatmentGroupSignature({ card, sessions, user }) {
  const [open, setOpen] = useState(false)
  const signed = sessions.filter(({ history }) => history.customer_signature_svg || history.customer_signed_at)
  const preview = signed.find(({ history }) => history.customer_signature_svg)?.history.customer_signature_svg
  return <><div className="today-session-signatures"><div className="today-signature-preview">{preview && <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview)}`} alt={`Chữ ký nhóm ${card.product_name}`} />}<small>{signed.length === sessions.length ? 'Đã ký' : signed.length ? `Đã ký ${signed.length}/${sessions.length} buổi` : 'Chưa ký'}</small></div><button type="button" className="session-followup-button" onClick={() => setOpen(true)} aria-label={`Ghi chú và chữ ký nhóm ${card.product_name}`}><Pencil size={13} aria-hidden="true" />{signed.length === sessions.length ? 'Ghi chú / Xem chữ ký' : 'Ghi chú / Ký'}</button></div>{open && <TreatmentGroupSessionDialog card={card} sessions={sessions} user={user} onClose={() => setOpen(false)} />}</>
}