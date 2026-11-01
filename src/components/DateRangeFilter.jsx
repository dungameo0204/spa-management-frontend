export default function DateRangeFilter({ startDate, endDate, onChange }) {
  return (
    <div className="report-filters date-range-filter">
      <label className="field">
        <span>Từ ngày</span>
        <input
          type="date"
          aria-label="Từ ngày"
          value={startDate}
          onChange={e => onChange(e.target.value, endDate)}
        />
      </label>
      <span className="date-range-separator" aria-hidden="true">→</span>
      <label className="field">
        <span>Đến ngày</span>
        <input
          type="date"
          aria-label="Đến ngày"
          value={endDate}
          onChange={e => onChange(startDate, e.target.value)}
        />
      </label>
    </div>
  )
}