import { RefreshCw } from 'lucide-react'

export default function RefreshButton({ label = 'Tải lại dữ liệu', disabled = false, onClick }) {
  return <button type="button" className="icon-btn" aria-label={label} disabled={disabled} onClick={onClick}><RefreshCw size={17} /></button>
}