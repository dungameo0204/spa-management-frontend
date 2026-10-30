import { LayoutDashboard, CalendarDays, UsersRound, ShoppingBag, Package, ContactRound, ChartNoAxesCombined, Building2, BadgeCheck, UserCog, ReceiptText, Boxes, HandCoins, Wallet, CreditCard, Sparkles, ClipboardList, TrendingUp } from 'lucide-react'

export const routes = [
  { path: '/', label: 'Tổng quan', icon: LayoutDashboard, group: 'main' },
  { path: '/customers', label: 'Khách hàng', icon: UsersRound, group: 'main' },
  { path: '/appointments', label: 'Lịch hẹn', icon: CalendarDays, group: 'main' },
  { path: '/invoices', label: 'Bán hàng', icon: ShoppingBag, group: 'main' },
  { path: '/products', label: 'Sản phẩm & dịch vụ', icon: Package, group: 'operations', permission: 'products.view' },
  { path: '/treatments', label: 'Liệu trình', icon: Sparkles, group: 'operations' },
  { path: '/imports', label: 'Nhập kho', icon: Boxes, group: 'operations' },
  { path: '/inventory', label: 'Tồn kho', icon: Package, group: 'operations', permission: 'inventory.manage' },
  { path: '/expenses', label: 'Phiếu chi', icon: ReceiptText, group: 'operations' },
  { path: '/wallet', label: 'Ví khách hàng', icon: Wallet, group: 'operations' },
  { path: '/debts', label: 'Thu công nợ', icon: CreditCard, group: 'operations' },
  { path: '/staffs', label: 'Hồ sơ nhân sự', icon: ContactRound, group: 'people' },
  { path: '/commissions', label: 'Công ca', icon: HandCoins, group: 'people', permission: 'commissions.view' },
  { path: '/consultants', label: 'Hoa hồng · tư vấn', icon: TrendingUp, group: 'people', permission: 'consultants.view' },
  { path: '/reports', label: 'Báo cáo', icon: ChartNoAxesCombined, group: 'manager', permission: 'reports.view' },
  { path: '/branches', label: 'Chi nhánh', icon: Building2, group: 'manager', permission: 'branches.manage' },
  { path: '/roles', label: 'Chức vụ', icon: BadgeCheck, group: 'manager', permission: 'roles.manage' },
  { path: '/users', label: 'Tài khoản', icon: UserCog, group: 'manager', permission: 'users.manage' },
]
export const groupNames = { main: 'LÀM VIỆC', operations: 'VẬN HÀNH', people: 'NHÂN SỰ', manager: 'QUẢN LÝ' }
export const overviewIcon = TrendingUp