import { createContext, useContext, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut, Menu, X, ChevronDown, MoreHorizontal, Moon, Sun } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { routes, groupNames } from '../app/routes'
import { canAccess, resolveBranch } from '../auth/permissions'
import { useAuth } from '../auth/AuthProvider'
import { listResource } from '../api/resources'
import InstallPrompt from './InstallPrompt'
import OfflineNotice from './OfflineNotice'
import { useTheme } from './ThemeProvider'

const BranchContext = createContext(null)
export const useBranch = () => useContext(BranchContext)
export default function AppShell() {
  useEffect(() => { const onWheel = event => { if (event.target instanceof HTMLInputElement && event.target.type === 'number' && document.activeElement === event.target) event.target.blur() }; document.addEventListener('wheel', onWheel, { capture: true, passive: true }); return () => document.removeEventListener('wheel', onWheel, true) }, [])
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [selected, setSelected] = useState(() => sessionStorage.getItem('xuly.branch') || '')
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const manager = user.system_role === 'MANAGER'
  const { data: branches } = useQuery({ queryKey: ['branches', 'selector'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const branch = resolveBranch(user, selected)
  const links = routes.filter(item => !item.permission || canAccess(user, item.permission))
  const active = routes.find(item => item.path === location.pathname)
  return <BranchContext.Provider value={branch}>
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand"><span className="brand-symbol">✦</span><div><strong>Xuly</strong><small>QUẢN LÝ SPA</small></div><button className="close-menu" aria-label="Đóng menu" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <div className="sidebar-caption">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">{Object.entries(groupNames).map(([group, label]) => { const items = links.filter(item => item.group === group); if (!items.length) return null; return <div className="nav-group" key={group}><p>{label}</p>{items.map(({ path, icon: Icon, label: name }) => <NavLink onClick={() => setOpen(false)} key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.85} />{name}</NavLink>)}</div> })}</nav>
        <div className="sidebar-bottom"><button className="theme-toggle" aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} onClick={toggle}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}<span className="theme-switch" /></button><InstallPrompt /><button className="logout-link" onClick={logout}><LogOut size={18} /> Đăng xuất</button></div>
      </aside>
      {open && <button className="backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
      <div className="workspace"><header className="topbar"><button className="menu-trigger" aria-label="Mở menu" onClick={() => setOpen(true)}><Menu size={22} /></button><div className="topbar-title"><span>KHÔNG GIAN QUẢN LÝ</span><strong>{active?.label || 'Xuly'}</strong></div><div className="topbar-actions">{manager ? <label className="branch-select"><span>Cơ sở</span><select aria-label="Chọn chi nhánh" value={selected} onChange={e => { setSelected(e.target.value); sessionStorage.setItem('xuly.branch', e.target.value) }}><option value="">Tất cả chi nhánh</option>{branches?.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><ChevronDown size={15} /></label> : <span className="branch-name">Cơ sở của bạn</span>}<div className="avatar" title={user.fullname}>{user.fullname?.trim()?.[0]?.toUpperCase() || 'X'}</div></div></header><OfflineNotice /><main className="main-content"><Outlet /></main></div>
      <nav className="mobile-nav" aria-label="Điều hướng nhanh">{links.filter(item => item.group === 'main').map(({ path, icon: Icon, label }) => <NavLink key={path} to={path} end={path === '/'}><Icon size={21} /><span>{label}</span></NavLink>)}<button onClick={() => setOpen(true)}><MoreHorizontal size={22} /><span>Thêm</span></button></nav>
    </div>
  </BranchContext.Provider>
}