import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureClient } from '../api/client'
import { loginRequest } from '../api/resources'

const AuthContext = createContext(null)
const key = 'xuly.session'
function readSession() { try { const data = JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key)); return data?.token && ['MANAGER', 'STAFF'].includes(data?.user?.system_role) ? data : null } catch { return null } }
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const queryClient = useQueryClient()
  function logout() { localStorage.removeItem(key); sessionStorage.removeItem(key); sessionStorage.removeItem('xuly.branch'); sessionStorage.removeItem('solea.session'); sessionStorage.removeItem('solea.branch'); setSession(null); queryClient.clear() }
  useEffect(() => { configureClient(() => readSession()?.token || null, logout) })
  async function login(credentials) {
    const result = await loginRequest(credentials)
    if (!['MANAGER', 'STAFF'].includes(result?.data?.user?.system_role)) throw new Error('Tài khoản này không thuộc ứng dụng quản lý spa.')
    localStorage.setItem(key, JSON.stringify(result.data)); sessionStorage.removeItem(key); setSession(result.data)
  }
  return <AuthContext.Provider value={{ user: session?.user, token: session?.token, login, logout }}>{children}</AuthContext.Provider>
}
export function useAuth() { return useContext(AuthContext) }