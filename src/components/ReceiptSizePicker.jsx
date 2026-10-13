export const receiptSizes = ['K57', 'K80', 'A5', 'A4']
const storageKey = 'xuly.receipt-size'

export function readReceiptSize() {
  try {
    const stored = localStorage.getItem(storageKey)
    return receiptSizes.includes(stored) ? stored : 'A4'
  } catch { return 'A4' }
}

export function saveReceiptSize(size) {
  try { localStorage.setItem(storageKey, size) } catch { /* Printing still works without storage. */ }
}

export default function ReceiptSizePicker({ value, onChange }) {
  return <label className="field receipt-size-picker">Khổ giấy in
    <select value={value} onChange={e => { saveReceiptSize(e.target.value); onChange(e.target.value) }}>
      <option value="K57">K57 · máy in hóa đơn 57 mm</option>
      <option value="K80">K80 · máy in hóa đơn 80 mm</option>
      <option value="A5">A5 · giấy thường</option>
      <option value="A4">A4 · giấy thường</option>
    </select>
  </label>
}