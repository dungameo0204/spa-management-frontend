import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [ios, setIos] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  useEffect(() => {
    const listener = e => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', listener)
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.navigator.standalone)
    return () => window.removeEventListener('beforeinstallprompt', listener)
  }, [])
  if (!prompt && !ios) return null
  return <button className="install-link" onClick={() => prompt ? prompt.prompt().then(() => setPrompt(null)) : setIosHelp(true)}><Download size={17} /> Cài ứng dụng{iosHelp && <span role="status">Trên Safari: chọn Chia sẻ → Thêm vào Màn hình chính.</span>}</button>
}