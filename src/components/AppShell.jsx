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
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const location = useLocation()
  const manager = user.system_role === 'MANAGER'
  const { data: branches } = useQuery({ queryKey: ['branches', 'selector'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const branch = resolveBranch(user, selected)
  const links = routes.filter(item => !item.permission || canAccess(user, item.permission))
  const active = routes.find(item => item.path === location.pathname)
  const selectBranch = value => { setSelected(String(value)); sessionStorage.setItem('xuly.branch', String(value)); setBranchMenuOpen(false) }
  useEffect(() => {
    if (!branchMenuOpen) return
    const closeOnEscape = event => { if (event.key === 'Escape') setBranchMenuOpen(false) }
    const closeOnOutside = event => { if (!event.target.closest('.branch-picker')) setBranchMenuOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutside)
    return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOnOutside) }
  }, [branchMenuOpen])
  return <BranchContext.Provider value={branch}>
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand"><img className="brand-symbol" src="/icons/icon.svg" alt="" width="40" height="40" /><div><strong>Xuly</strong><small>QUẢN LÝ SPA</small></div><button className="close-menu" aria-label="Đóng menu" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <div className="sidebar-caption">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">{Object.entries(groupNames).map(([group, label]) => { const items = links.filter(item => item.group === group); if (!items.length) return null; return <div className="nav-group" key={group}><p>{label}</p>{items.map(({ path, icon: Icon, label: name }) => <NavLink onClick={() => setOpen(false)} key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.85} />{name}</NavLink>)}</div> })}</nav>
        <div className="sidebar-bottom"><button className="theme-toggle" aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} onClick={toggle}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}<span className="theme-switch" /></button><InstallPrompt /><button className="logout-link" onClick={logout}><LogOut size={18} /> Đăng xuất</button><small className="app-version">Xuly Spa · v{__APP_VERSION__}</small></div>
      </aside>
      {open && <button className="backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
      <div className="workspace"><header className="topbar"><button className="menu-trigger" aria-label="Mở menu" onClick={() => setOpen(true)}><Menu size={22} /></button><div className="topbar-title"><span>KHÔNG GIAN QUẢN LÝ</span><strong>{active?.label || 'Xuly'}</strong></div><div className="topbar-actions">{manager ? <div className="branch-picker"><button type="button" className="branch-picker-trigger" aria-label="Chọn chi nhánh" aria-expanded={branchMenuOpen} aria-controls="branch-picker-options" onClick={() => setBranchMenuOpen(value => !value)}><span className="branch-picker-label">Cơ sở</span><strong>{branches?.data?.find(b => String(b.id) === selected)?.name || 'Tất cả chi nhánh'}</strong><ChevronDown size={16} aria-hidden="true" /></button>{branchMenuOpen && <div className="branch-picker-options" id="branch-picker-options" aria-label="Cơ sở"><button type="button" aria-current={!selected ? 'true' : undefined} onClick={() => selectBranch('')}>Tất cả chi nhánh</button>{branches?.data?.map(b => <button type="button" key={b.id} aria-current={String(b.id) === selected ? 'true' : undefined} onClick={() => selectBranch(b.id)}>{b.name}</button>)}</div>}</div> : <span className="branch-name">Cơ sở của bạn</span>}<div className="avatar" title={user.fullname}>{user.fullname?.trim()?.[0]?.toUpperCase() || 'X'}</div></div></header><OfflineNotice /><main className="main-content"><Outlet /></main></div>
      <nav className="mobile-nav" aria-label="Điều hướng nhanh">{links.filter(item => item.group === 'main').map(({ path, icon: Icon, label }) => <NavLink key={path} to={path} end={path === '/'}><Icon size={21} /><span>{label}</span></NavLink>)}<button onClick={() => setOpen(true)}><MoreHorizontal size={22} /><span>Thêm</span></button></nav>
    </div>
  </BranchContext.Provider>
}