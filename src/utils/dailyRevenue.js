import { formatSpaDate } from './format'

export const dailyRevenueMoneyColumns = [
  { label: 'Tổng doanh thu', value: row => row.totalRevenue },
  { label: 'Doanh thu dịch vụ', value: row => row.serviceRevenue },
  { label: 'Doanh thu sản phẩm', value: row => row.productRevenue },
  { label: 'Doanh thu thu nợ cũ', value: row => row.legacyDebtRevenue },
  { label: 'Thu hóa đơn', value: row => row.receipts?.invoiceCash },
  { label: 'Thu nợ', value: row => row.receipts?.debtPayments },
  { label: 'Nạp ví', value: row => row.receipts?.walletTopups },
  { label: 'Tiền thực thu', value: row => row.receipts?.total },
  { label: 'Ví đã dùng (không cộng thu)', value: row => row.receipts?.walletUsedExcluded },
  { label: 'Phiếu chi', value: row => row.expenses?.expenseVouchers },
  { label: 'Nhập kho', value: row => row.expenses?.inventoryImports },
  { label: 'Tổng chi', value: row => row.expenses?.total },
  { label: 'Dòng tiền thuần', value: row => row.netCashFlow },
]

export const dailyRevenueColumns = [{ label: 'Ngày', value: row => formatSpaDate(row.date) }, ...dailyRevenueMoneyColumns.map(col => ({ ...col, money: true }))]
