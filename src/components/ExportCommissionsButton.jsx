import { useState } from 'react'

export default function ExportCommissionsButton({ range }) {
  const [exporting, setExporting] = useState(false), [error, setError] = useState('')
  async function download() {
    setExporting(true)
    setError('')
    try {
      const { exportReport } = await import('../utils/exportReport')
      await exportReport(range, true)
    } catch (err) { setError(`Không thể xuất Excel: ${err.message}`) }
    finally { setExporting(false) }
  }
  return <div><button className="btn secondary" disabled={exporting} onClick={download}>{exporting ? 'Đang xuất công ca...' : 'Xuất Excel công ca toàn bộ nhân viên'}</button>{error && <p className="form-alert" role="alert">{error}</p>}</div>
}