import DateInput from './DateInput'
import './DateRangeFilter.css'

export default function DateRangeFilter({ startDate, endDate, onChange, onClear }) {
  return (
    <div className="report-filters date-range-filter" role="group" aria-label="Khoảng ngày">
      <label className="field">
        <span>Từ ngày</span>
        <DateInput aria-label="Từ ngày" value={startDate} onChange={value => onChange(value, endDate)} />
      </label>
      <label className="field">
        <span>Đến ngày</span>
        <DateInput aria-label="Đến ngày" value={endDate} onChange={value => onChange(startDate, value)} />
      </label>
      {onClear && (startDate || endDate) && <button type="button" className="btn secondary date-range-clear" onClick={onClear}>Xóa lọc</button>}
    </div>
  )
}