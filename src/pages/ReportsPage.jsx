import { useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownRight, Scale, TrendingUp, Wallet } from 'lucide-react'
import { useBranch } from '../components/AppShell'
import DataList from '../components/DataList'
import FormDrawer from '../components/FormDrawer'
import ReportDocumentItems from '../components/ReportDocumentItems'
import RevenueCharts from '../components/RevenueCharts'
import DailyRevenueTable from '../components/DailyRevenueTable'
import StaffEarnings from '../components/StaffEarnings'
import { getRevenue, getReportDetails, getResource, getProductRevenue, getProductInvoices } from '../api/resources'
import { formatCurrency, formatSpaDate, today } from '../utils/format'
import { validateDateRange } from '../utils/validation'
import { labelFor, isMoneyField } from '../utils/fieldLabels'
import RefreshButton from '../components/RefreshButton'
import DateInput from '../components/DateInput'
import './ReportsPage.css'

const pct = (part, total) => {
  const num = Number(part || 0), den = Number(total || 0)
  if (den <= 0 || num <= 0) return 0
  return Math.min(100, Math.round((num / den) * 1000) / 10)
}

const compactMoney = value => {
  const n = Number(value || 0)
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2).replace(/\.00$/, '')} tỷ`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} tr`
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)} nghìn`
  return `${n} đ`
}

function BreakdownDonutCard({ title, subtitle, total, totalLabel, items, loading }) {
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const positiveSum = items.reduce((sum, item) => sum + Math.max(0, Number(item.value || 0)), 0)
  const denominator = Number(total || 0) > 0 ? Number(total) : positiveSum
  let offset = 0
  const segments = items.map((item, index) => {
    const share = pct(item.value, denominator)
    const length = (share / 100) * circumference
    const seg = { ...item, index, share, length, offset }
    offset += length
    return seg
  })
  const activeIndex = hovered ?? selected
  const active = activeIndex != null ? segments[activeIndex] : null
  const toggleSelect = index => setSelected(current => current === index ? null : index)
  return (
    <article className="report-breakdown-card">
      <div className="report-breakdown-head">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div className="report-donut-body">
        <div className="report-donut-chart" role="img" aria-label={title}>
          <svg viewBox="0 0 148 148" width="148" height="148">
            <circle className="report-donut-track" cx="74" cy="74" r={radius} />
            {!loading && positiveSum > 0 && segments.map(seg => seg.length > 0 && (
              <circle
                key={seg.label}
                className={`report-donut-slice${activeIndex === seg.index ? ' is-active' : activeIndex != null ? ' is-dim' : ''}`}
                cx="74"
                cy="74"
                r={radius}
                stroke={seg.color}
                strokeDasharray={`${Math.max(0, seg.length - (segments.filter(s => s.length > 0).length > 1 ? 2.5 : 0))} ${circumference}`}
                strokeDashoffset={-seg.offset}
                onClick={() => toggleSelect(seg.index)}
                onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(seg.index) }}
                onPointerLeave={event => { if (event.pointerType === 'mouse') setHovered(null) }}
              />
            ))}
          </svg>
          <div className="report-donut-center">
            {loading ? (
              <span>Đang tải...</span>
            ) : active ? (
              <>
                <strong style={{ color: active.color }}>{active.share}%</strong>
                <span>{active.shortLabel || active.label}</span>
              </>
            ) : (
              <>
                <strong>{compactMoney(denominator)}</strong>
                <span>{totalLabel}</span>
              </>
            )}
          </div>
        </div>
        <div className="report-donut-legend">
          {segments.map(seg => (
            <button
              type="button"
              className={`report-legend-item${activeIndex === seg.index ? ' is-active' : ''}`}
              aria-pressed={selected === seg.index}
              key={seg.label}
              style={{ '--row-color': seg.color }}
              onClick={() => toggleSelect(seg.index)}
              onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(seg.index) }}
              onPointerLeave={event => { if (event.pointerType === 'mouse') setHovered(null) }}
            >
              <div className="report-legend-left">
                <i className="report-breakdown-dot" aria-hidden="true" />
                <div className="report-legend-text">
                  <span className="report-legend-label">{seg.label}</span>
                  <small className="report-breakdown-sub">{seg.note}</small>
                </div>
              </div>
              <div className="report-legend-right">
                <strong>{loading ? 'Đang tải...' : formatCurrency(seg.value)}</strong>
                <span className="report-legend-pill">{seg.share}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}
const tabs = { invoices: 'Hóa đơn', debt_payments: 'Thu nợ', wallet_logs: 'Nạp ví', expenses: 'Phiếu chi', inventory_imports: 'Nhập kho', commissions: 'Công ca', consultants: 'Tư vấn' }
const detailKeys = ['branch_name', 'customer_name', 'staff_name', 'product_name', 'total_amount', 'amount', 'paid_amount', 'revenue_amount', 'commission_amount_snapshot', 'invoice_date', 'payment_date', 'execution_date', 'expense_date', 'import_date', 'note', 'service_revenue', 'product_revenue']
const showDocumentField = (detail, kind, key, value) => value != null && typeof value !== 'object' && !['deleted_at', 'payment_api_key', 'payment_client_id'].includes(key) && !(kind === 'debt_payments' && key === 'invoice_total_amount') && (key !== 'updated_at' || Boolean(String(detail.updated_by ?? '').trim()))
export default function ReportsPage() {
  const { branchId } = useBranch()
  const queryClient = useQueryClient()
  const [startDate, setStartDate] = useState(`${today().slice(0, 7)}-01`), [endDate, setEndDate] = useState(today()), [type, setType] = useState('invoices'), [page, setPage] = useState(1), [productPage, setProductPage] = useState(1), [product, setProduct] = useState(null), [invoicePage, setInvoicePage] = useState(1), [detail, setDetail] = useState(null), [detailKind, setDetailKind] = useState(null), [detailError, setDetailError] = useState(''), [exporting, setExporting] = useState(false), [detailSearch, setDetailSearch] = useState(''), [productSearch, setProductSearch] = useState('')
  const range = { startDate, endDate, ...(branchId ? { branchId } : {}) }, valid = !validateDateRange(range), staffType = ['commissions', 'consultants'].includes(type)
  const summary = useQuery({ queryKey: ['reports', 'revenue', range], queryFn: () => getRevenue(range), enabled: valid, placeholderData: keepPreviousData })
  const details = useQuery({ queryKey: ['reports', 'details', type, range, detailSearch.trim(), page], queryFn: () => getReportDetails(type, { ...range, search: detailSearch.trim() }, page), enabled: valid && !staffType, placeholderData: (prev, prevQuery) => prevQuery?.queryKey?.[2] === type ? prev : undefined })
  const products = useQuery({ queryKey: ['reports', 'products', range, productSearch.trim(), productPage], queryFn: () => getProductRevenue({ ...range, search: productSearch.trim() }, productPage), enabled: valid, placeholderData: keepPreviousData })
  const top = useQuery({ queryKey: ['reports', 'products-top', range], queryFn: () => getProductRevenue(range, 1, 10), enabled: valid, placeholderData: keepPreviousData })
  const productInvoices = useQuery({ queryKey: ['reports', 'product-invoices', product?.product_id, range, invoicePage], queryFn: () => getProductInvoices(product.product_id, range, invoicePage), enabled: valid && Boolean(product), placeholderData: keepPreviousData })
  async function openDetail(row, kind = type) { setDetailError(''); const mapping = { invoices: ['invoices', row.invoice_id || row.id], debt_payments: ['debts', row.id], wallet_logs: ['wallet', row.id], expenses: ['expenses', row.id], inventory_imports: ['imports', row.id] }; const [resource, id] = mapping[kind] || []; if (!resource || !id) return setDetailError('Không có mã chứng từ để mở chi tiết.'); try { const full = await getResource(resource, id); setDetailKind(kind); setDetail(full) } catch (err) { setDetailError(err.message) } }
  async function download() { setExporting(true); setDetailError(''); try { const { exportReport } = await import('../utils/exportReport'); await exportReport(range) } catch (err) { setDetailError(`Không thể xuất Excel: ${err.message}`) } finally { setExporting(false) } }
  async function refresh() { setDetailError(''); await queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'active' }); await queryClient.invalidateQueries({ queryKey: ['staff-totals'], refetchType: 'active' }); await queryClient.invalidateQueries({ queryKey: ['staff-earnings'], refetchType: 'active' }) }
  const receipts = summary.data?.receipts?.byPaymentMethod
  const kpis = [
    { key: 'revenue', tone: 'is-revenue', icon: TrendingUp, label: 'Tổng doanh thu', value: summary.data?.totalRevenue, note: 'Dịch vụ + sản phẩm' },
    { key: 'receipts', tone: 'is-receipt', icon: Wallet, label: 'Tiền thực thu', value: summary.data?.receipts?.total, note: 'Không cộng lại tiền ví đã sử dụng' },
    { key: 'expenses', tone: 'is-expense', icon: ArrowDownRight, label: 'Tổng chi', value: summary.data?.expenses?.total, note: 'Gồm chi phí và nhập kho' },
    { key: 'net', tone: 'is-net', icon: Scale, label: 'Dòng tiền thuần', value: summary.data?.netCashFlow, note: 'Thực thu trừ tổng chi · Không phải lợi nhuận' },
  ]
  const revenueBreakdown = [
    { label: 'Doanh thu dịch vụ', shortLabel: 'Dịch vụ', value: summary.data?.serviceRevenue, note: 'Dịch vụ sau chiết khấu', color: '#1d6496' },
    { label: 'Doanh thu sản phẩm', shortLabel: 'Sản phẩm', value: summary.data?.productRevenue, note: 'Hàng hóa sau chiết khấu', color: '#0ea5a4' },
  ]
  const receiptBreakdown = [
    { label: 'Thực thu tiền mặt', shortLabel: 'Tiền mặt', value: receipts?.CASH, note: 'Thanh toán tiền mặt', color: '#15803d' },
    { label: 'Thực thu chuyển khoản', shortLabel: 'Chuyển khoản', value: receipts?.TRANSFER, note: 'Chuyển khoản ngân hàng', color: '#2563eb' },
    { label: 'Thực thu thẻ', shortLabel: 'Thẻ POS', value: receipts?.CARD, note: 'Quẹt thẻ POS', color: '#7c3aed' },
    ...(Number(receipts?.OTHER) > 0 ? [{ label: 'Thực thu khác / chưa xác định', shortLabel: 'Khác', value: receipts.OTHER, note: 'Dữ liệu cũ hoặc chưa chuẩn hóa', color: '#64748b' }] : []),
  ]
  const keys = Object.keys(details.data?.data?.[0] || {}).filter(key => detailKeys.includes(key)).slice(0, 7)
  const refreshing = summary.isFetching || details.isFetching || products.isFetching || top.isFetching || productInvoices.isFetching
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">THẤU HIỂU ĐỂ PHÁT TRIỂN</span><h1>Báo cáo kinh doanh</h1><p>Nhìn rõ các con số, đưa ra quyết định tự tin hơn.</p></div><div className="page-heading-actions"><button className="btn secondary" disabled={!valid || exporting} onClick={download}>{exporting ? 'Đang xuất...' : 'Xuất Excel toàn kỳ'}</button></div></div><div className="report-filters"><label className="field"><span>Từ ngày</span><DateInput aria-label="Từ ngày" value={startDate} onChange={value => { setStartDate(value); setPage(1); setProductPage(1) }} /></label><label className="field"><span>Đến ngày</span><DateInput aria-label="Đến ngày" value={endDate} onChange={value => { setEndDate(value); setPage(1); setProductPage(1) }} /></label></div>{!valid && <p className="form-alert">Khoảng ngày không hợp lệ.</p>}{summary.isError && <p className="form-alert">{summary.error.message}</p>}
    <section className={`report-overview-section${summary.isFetching && !summary.isLoading ? ' is-fetching' : ''}`} aria-label="Tổng quan tài chính">
      <div className="report-kpi-grid">
        {kpis.map(({ key, tone, icon: Icon, label, value, note }) => (
          <article className={`report-kpi-card ${tone}`} key={key}>
            <div className="report-kpi-head">
              <span className="report-kpi-label">{label}</span>
              <span className="report-kpi-icon" aria-hidden="true"><Icon size={18} /></span>
            </div>
            <strong className="report-kpi-value">{summary.isLoading ? 'Đang tải...' : formatCurrency(value)}</strong>
            <small className="report-kpi-note">{note}</small>
          </article>
        ))}
      </div>
      <div className="report-breakdown-grid">
        <BreakdownDonutCard
          title="Cơ cấu doanh thu"
          subtitle="Tỷ trọng trên tổng doanh thu"
          total={summary.data?.totalRevenue}
          totalLabel="Tổng doanh thu"
          items={revenueBreakdown}
          loading={summary.isLoading}
        />
        <BreakdownDonutCard
          title="Phân bổ tiền thực thu"
          subtitle="Theo phương thức thanh toán"
          total={summary.data?.receipts?.total}
          totalLabel="Tiền thực thu"
          items={receiptBreakdown}
          loading={summary.isLoading}
        />
      </div>
    </section>
    <DailyRevenueTable range={range} data={summary.data?.daily} loading={summary.isLoading} error={summary.error} valid={valid} /><section className="section-card"><div className="section-heading"><div><span className="eyebrow">CƠ CẤU DOANH THU</span><h2>Doanh thu từng sản phẩm và dịch vụ</h2></div></div>{top.isError && <p className="form-alert">{top.error.message}</p>}<RevenueCharts data={top.data?.data || []} /><DataList data={products.data} columns={[{ key: 'product_name', label: 'Sản phẩm / dịch vụ' }, { key: 'is_product', label: 'Phân loại', render: item => Number(item.is_product) ? 'Sản phẩm' : 'Dịch vụ' }, { key: 'quantity', label: 'Số lượng' }, { key: 'revenue', label: 'Doanh thu', render: item => formatCurrency(item.revenue) }]} search={productSearch} onSearch={value => { setProductSearch(value); setProductPage(1) }} page={productPage} onPage={setProductPage} loading={products.isLoading} fetching={products.isFetching} error={products.error} onRetry={() => products.refetch()} onRow={row => { setProduct(row); setInvoicePage(1) }} toolbarActions={<RefreshButton label="Tải lại báo cáo" disabled={refreshing} onClick={refresh} />} /></section><section className="section-card"><div className="section-heading"><div><span className="eyebrow">CHI TIẾT THEO CHỨNG TỪ</span><h2>Giao dịch trong kỳ</h2></div><div className="report-tabs" role="tablist">{Object.entries(tabs).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={type === key} className={type === key ? 'active' : ''} onClick={() => { setType(key); setPage(1) }}>{label}</button>)}</div></div>{staffType ? <StaffEarnings key={`${type}-${startDate}-${endDate}-${branchId}`} kind={type} range={range} /> : <DataList data={details.data} columns={keys.map(key => ({ key, label: labelFor(key), render: row => isMoneyField(key) ? formatCurrency(row[key]) : key.endsWith('_date') ? formatSpaDate(row[key]) : row[key] ?? '—' }))} search={detailSearch} onSearch={value => { setDetailSearch(value); setPage(1) }} page={page} onPage={setPage} loading={details.isLoading} fetching={details.isFetching} error={details.error} onRetry={() => details.refetch()} onRow={row => openDetail(row)} toolbarActions={<RefreshButton label="Tải lại chi tiết" disabled={refreshing} onClick={refresh} />} />}</section>{product && <FormDrawer title={product.product_name} onClose={() => setProduct(null)}><DataList data={productInvoices.data} columns={[{ key: 'invoice_date', label: 'Ngày bán', render: row => formatSpaDate(row.invoice_date) }, { key: 'customer_name', label: 'Khách hàng' }, { key: 'quantity', label: 'Số lượng' }, { key: 'revenue', label: 'Doanh thu', render: row => formatCurrency(row.revenue) }]} search="" onSearch={() => {}} page={invoicePage} onPage={setInvoicePage} loading={productInvoices.isLoading} error={productInvoices.error} onRetry={() => productInvoices.refetch()} /></FormDrawer>}{detail && <FormDrawer title="Chi tiết chứng từ" onClose={() => setDetail(null)}>{detailError && <p className="form-alert">{detailError}</p>}<ReportDocumentItems detail={detail} kind={detailKind} />{Object.entries(detail).filter(([key, value]) => showDocumentField(detail, detailKind, key, value)).map(([key, value]) => <div className="detail-list" key={key}><span>{labelFor(key)}</span><b>{isMoneyField(key) ? formatCurrency(value) : key.endsWith('_date') ? formatSpaDate(value) : String(value)}</b></div>)}</FormDrawer>}</div>
}