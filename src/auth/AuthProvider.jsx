import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureClient } from '../api/client'
import { getSession, loginRequest } from '../api/resources'

const AuthContext = createContext(null)
const key = 'xuly.session'
const allowedUser = user => ['MANAGER', 'STAFF'].includes(user?.system_role)
function readSession() {
  for (const storage of [localStorage, sessionStorage]) {
    try { const data = JSON.parse(storage.getItem(key)); if (typeof data?.token === 'string' && data.token) return data } catch { /* Ignore corrupt or unavailable storage. */ }
  }
  return null
}
function saveSession(session) {
  localStorage.setItem(key, JSON.stringify(session))
  sessionStorage.removeItem(key)
}
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [status, setStatus] = useState(() => session ? 'checking' : 'anonymous')
  const [error, setError] = useState(null)
  const current = useRef(session), identity = useRef({}), pending = useRef(null), mounted = useRef(false)
  const queryClient = useQueryClient()
  const logout = useCallback(() => {
    identity.current = {}; current.current = null; pending.current = null
    localStorage.removeItem(key); sessionStorage.removeItem(key); sessionStorage.removeItem('xuly.branch'); sessionStorage.removeItem('solea.session'); sessionStorage.removeItem('solea.branch')
    setSession(null); setError(null); setStatus('anonymous'); queryClient.clear()
  }, [queryClient])
  const restore = useCallback(() => {
    if (!current.current || pending.current) return pending.current
    const attempt = identity.current, saved = current.current
    setError(null); setStatus('checking')
    const task = getSession().then(result => {
      if (!mounted.current || identity.current !== attempt) return
      if (!allowedUser(result?.data?.user)) throw new Error('Thông tin phiên không hợp lệ hoặc tài khoản không thuộc ứng dụng quản lý spa.')
      const restored = { ...saved, user: result.data.user, tenant: result.data.tenant, expires_at: result.data.expires_at }
      saveSession(restored); current.current = restored; setSession(restored); setStatus('authenticated')
    }).catch(err => {
      if (!mounted.current || identity.current !== attempt) return
      if (err.status === 401) {
        logout()
      } else if (err.status === 403 && ['TENANT_DISABLED', 'TENANT_EXPIRED'].includes(err.code)) {
        setError(err)
        setStatus('blocked')
      } else {
        setError(err)
        setStatus('error')
      }
    }).finally(() => { if (pending.current === task) pending.current = null })
    pending.current = task
    return task
  }, [logout])
  useEffect(() => {
    mounted.current = true
    configureClient(() => current.current?.token || null, () => { if (mounted.current) logout() }, () => identity.current)
    restore()
    return () => { mounted.current = false }
  }, [logout, restore])
  async function login(credentials) {
    const attempt = {}; identity.current = attempt; pending.current = null
    const result = await loginRequest(credentials)
    if (!mounted.current || identity.current !== attempt) return
    if (!allowedUser(result?.data?.user) || !result?.data?.token) throw new Error('Tài khoản này không thuộc ứng dụng quản lý spa.')
    saveSession(result.data); queryClient.clear(); current.current = result.data; setSession(result.data); setError(null); setStatus('authenticated')
  }
  const waiting = status === 'checking', failed = status === 'error' || status === 'blocked'
  return <AuthContext.Provider value={{ user: status === 'authenticated' ? session?.user : null, token: session?.token, status, login, logout, retry: restore }}>
    {waiting || failed ? <div className="login-page"><section className="login-card" aria-label="Trạng thái phiên đăng nhập">
      <h2>{waiting ? 'Đang kiểm tra phiên đăng nhập…' : status === 'blocked' ? 'Không thể truy cập Spa' : 'Chưa thể xác minh phiên đăng nhập'}</h2>
      {waiting ? <p role="status">Vui lòng chờ trong giây lát.</p> : <><p role="alert">{error?.message}</p><button className="btn primary" onClick={restore}>Thử lại</button></>}
      <button className="btn" onClick={logout}>Đăng xuất</button>
    </section></div> : children}
  </AuthContext.Provider>
}
export function useAuth() { return useContext(AuthContext) }