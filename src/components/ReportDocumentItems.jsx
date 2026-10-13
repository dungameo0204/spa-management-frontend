import { formatCurrency } from '../utils/format'

export default function ReportDocumentItems({ kind, items }) {
  if (kind === 'expenses') {
    if (!items?.length) return null
    return <section aria-label="Các khoản chi"><h3>Các khoản chi</h3>{items.map((line, index) => <div className="line-item" key={line.id ?? index}><strong>{line.expense_type || 'Khoản chi'}</strong><p>Số tiền: {formatCurrency(line.amount)}</p></div>)}</section>
  }
  return items?.map((line, index) => <div className="line-item" key={line.id ?? index}><strong>{line.snapshot_name || line.product_name}</strong><p>{line.quantity} × {formatCurrency(line.snapshot_price ?? line.unit_price)} · Sau giảm: {formatCurrency(line.final_price ?? line.total_price)}</p>{line.consultants?.length > 0 && <p>Tư vấn: {line.consultants.map(c => c.staff_name).join(', ')}</p>}</div>)
}