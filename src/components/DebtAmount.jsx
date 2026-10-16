import { formatCurrency } from '../utils/format'

export default function DebtAmount({ value }) {
  return <span className={Number(value) > 0 ? 'debt-badge' : undefined}>{formatCurrency(value)}</span>
}