import { useState } from 'react'

export default function ExportTableButton({ options, filename, disabled, label = 'Xuất Excel' }) {
  const [exporting, setExporting] = useState(false), [error, setError] = useState('')
  async function download() {
    setExporting(true)
    setError('')
    try {
      const { exportTable } = await import('../utils/exportTable')
      await exportTable(options, filename)
    } catch (err) { setError(`Không thể xuất Excel: ${err.message}`) }
    finally { setExporting(false) }
  }
  return <div><button className="btn secondary" disabled={disabled || exporting} onClick={download}>{exporting ? 'Đang xuất...' : label}</button>{error && <p className="form-alert" role="alert">{error}</p>}</div>
}