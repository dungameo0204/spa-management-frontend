import { formatCurrency } from '../utils/format'
const colors = ['#315e50', '#b88b57', '#d67c75', '#839e83', '#728aad', '#cfb35d', '#8e77a2', '#79a9ac', '#a56871', '#898e67']
export default function RevenueCharts({ data = [] }) {
  const items = data.filter(item => Number(item.revenue) > 0).slice(0, 10)
  const total = items.reduce((sum, item) => sum + Number(item.revenue), 0)
  const max = Math.max(...items.map(item => Number(item.revenue)), 1)
  let position = 0
  const sectors = items.map((item, i) => { const begin = position; position += Number(item.revenue) / total * 100; return `${colors[i]} ${begin.toFixed(2)}% ${position.toFixed(2)}%` }).join(', ')
  return <div className="chart-grid"><div className="chart-panel"><h3>10 loại bán chạy theo doanh thu</h3>{items.length ? <div className="donut-layout"><div className="donut" role="img" aria-label="Biểu đồ tròn cơ cấu doanh thu" style={{ background: `conic-gradient(${sectors})` }} /><div className="chart-legend">{items.map((item, i) => <span key={item.product_id}><i style={{ background: colors[i] }} />{item.product_name} · {(Number(item.revenue) / total * 100).toFixed(1)}%</span>)}</div></div> : <p>Chưa có doanh thu trong kỳ.</p>}</div><div className="chart-panel"><h3>So sánh doanh thu theo mặt hàng</h3>{items.map(item => <div className="bar-row" key={item.product_id}><span>{item.product_name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Number(item.revenue) / max * 100}%` }} /></div><strong>{formatCurrency(item.revenue)}</strong></div>)}{!items.length && <p>Chưa có doanh thu trong kỳ.</p>}</div></div>
}