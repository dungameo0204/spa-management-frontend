import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { canAccess } from './permissions'
export default function RequireAuth({ permission }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (permission && !canAccess(user, permission)) return <Navigate to="/" replace />
  return <Outlet />
}