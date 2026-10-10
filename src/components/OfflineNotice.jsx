import { useEffect, useState } from 'react'
export default function OfflineNotice() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) } }, [])
  return online ? null : <div role="alert" className="offline">Bạn đang ngoại tuyến. Không thể xem dữ liệu mới hoặc lưu giao dịch. Vui lòng kết nối mạng.</div>
}