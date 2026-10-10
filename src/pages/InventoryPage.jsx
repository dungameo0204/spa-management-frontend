import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listResource } from '../api/resources'
import { useBranch } from '../components/AppShell'
import { Search } from 'lucide-react'

export default function InventoryPage() {
  const { branchId } = useBranch()
  const [page, setPage] = useState(1), [search, setSearch] = useState('')
  const products = useQuery({ queryKey: ['inventory', page, search, branchId], queryFn: () => listResource('products', { is_product: 1, search }, page) })
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">QUẢN LÝ KHO</span><h1>Tồn kho</h1><p>Số lượng sản phẩm theo từng cơ sở.</p></div></div>
    <div className="list-panel"><div className="list-toolbar"><div className="search-box"><Search size={18} /><input aria-label="Tìm sản phẩm tồn kho" placeholder="Tìm sản phẩm..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></div><span className="list-count">{products.data?.total || 0} sản phẩm</span></div>
      {products.isError ? <p className="form-alert">{products.error.message}</p> : products.isLoading ? <p>Đang tải tồn kho...</p> : <div className="table-scroll"><table><thead><tr><th>Sản phẩm</th><th>Cơ sở</th><th>Tồn kho</th></tr></thead><tbody>{products.data?.data?.flatMap(product => {
        const entries = branchId ? (product.inventory || []).filter(entry => Number(entry.branch_id) === Number(branchId)) : product.inventory || []
        return (entries.length ? entries : [{ branch_name: branchId ? 'Cơ sở của bạn' : 'Chưa có tồn kho', quantity: 0 }]).map((entry, index) => <tr key={`${product.id}-${entry.branch_id || index}`}><td data-label="Sản phẩm">{product.name}</td><td data-label="Cơ sở">{entry.branch_name || 'Cơ sở của bạn'}</td><td data-label="Tồn kho"><strong>{entry.quantity ?? 0} {product.unit || ''}</strong></td></tr>)
      })}</tbody></table></div>}
      {products.data?.totalPages > 1 && <div className="picker-pages"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><span>{page} / {products.data.totalPages}</span><button disabled={page >= products.data.totalPages} onClick={() => setPage(page + 1)}>Sau</button></div>}
    </div></div>
}