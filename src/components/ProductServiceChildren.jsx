import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, GitBranch, Plus, Trash2 } from 'lucide-react'
import { getResource } from '../api/resources'
import SearchPicker from './SearchPicker'
import './ProductServiceChildren.css'

export default function ProductServiceChildren({ ids = [], parentId, parentName, onChange, compact = false }) {
  const [adding, setAdding] = useState(false)
  const editable = Boolean(onChange)
  const visibleIds = compact ? ids.slice(0, 3) : ids
  const children = useQueries({ queries: visibleIds.map(id => ({
    queryKey: ['products', 'child-service', Number(id)],
    queryFn: () => getResource('products', id),
    staleTime: 60_000,
    retry: false,
  })) })
  function move(index, offset) {
    const next = [...ids]
    ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
    onChange(next)
  }
  if (compact && !ids.length) return null
  return <section className={`service-children ${compact ? 'service-children-compact' : ''}`} aria-label="Dịch vụ con">
    <div className="service-children-heading">
      {compact ? <span className="service-child-badge">Có {ids.length} dịch vụ con</span> : <><h3><GitBranch size={18} aria-hidden="true" /> Dịch vụ con <span className="service-child-badge">{ids.length}</span></h3>{editable && <button type="button" className="btn secondary" disabled={ids.length >= 200} onClick={() => setAdding(true)}><Plus size={16} /> Thêm dịch vụ con</button>}</>}
    </div>
    {!compact && <p className="helper-text">{editable ? 'Chọn các dịch vụ thành phần. Thứ tự bên dưới là thứ tự hiển thị; bỏ mục chỉ gỡ liên kết, không xóa dịch vụ.' : `Các dịch vụ thành phần thuộc ${parentName || 'dịch vụ chính'}.`}</p>}
    {ids.length ? <ol className="service-child-list">{visibleIds.map((id, index) => {
      const query = children[index]
      const name = query.data?.name || `Dịch vụ #${id}`
      return <li key={id} className="service-child-row">
        {!compact && <span className="service-child-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>}
        <div className="service-child-info"><strong>{query.isPending ? 'Đang tải dịch vụ...' : name}</strong>{!compact && <><span className="service-child-badge">Dịch vụ con</span><small>Thuộc: {parentName || 'Dịch vụ chính đang tạo'}</small></>}{query.isError && <span className="service-child-error">Không tải được dịch vụ #{id}. <button type="button" onClick={event => { event.stopPropagation(); query.refetch() }}>Thử lại</button></span>}</div>
        {editable && <div className="service-child-actions"><button type="button" className="icon-btn" aria-label={`Đưa ${name} lên`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button><button type="button" className="icon-btn" aria-label={`Đưa ${name} xuống`} disabled={index === ids.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button><button type="button" className="icon-btn" aria-label={`Bỏ ${name}`} onClick={() => onChange(ids.filter(entry => entry !== id))}><Trash2 size={17} /></button></div>}
      </li>
    })}</ol> : <p className="service-child-empty">Chưa có dịch vụ con.</p>}
    {compact && ids.length > 3 && <small className="service-child-more">+{ids.length - 3} dịch vụ khác · Mở chi tiết để xem</small>}
    {editable && ids.length >= 200 && <p className="helper-text">Tối đa 200 dịch vụ con.</p>}
    {editable && adding && ids.length < 200 && <div className="service-child-picker"><SearchPicker resource="products" label="Dịch vụ con" filters={{ is_product: 0 }} excludeIds={[parentId, ...ids]} itemFilter={item => Number(item.is_product) === 0 && !item.deleted_at} onChange={item => { if (!item) return; onChange([...ids, Number(item.id)]); setAdding(false) }} /><button type="button" className="btn secondary" onClick={() => setAdding(false)}>Hủy thêm</button></div>}
  </section>
}