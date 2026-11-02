import { Search, Inbox } from 'lucide-react'
import Pagination from './Pagination'

export default function DataList({ data, columns, search, onSearch, page, onPage, pageSize = 20, loading, error, onRetry, onRow, toolbarActions, className = '' }) {
  if (error) return <div className="empty-state"><Inbox size={38} /><h3>Không tải được dữ liệu</h3><p>{error.message}</p><button className="btn secondary" onClick={onRetry}>Thử lại</button></div>
  const items = data?.data || []
  const totalPages = Math.max(1, data?.totalPages || Math.ceil((data?.total || 0) / pageSize))

  return (
    <div className={`list-panel ${className}`.trim()}>
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." value={search} onChange={e => onSearch(e.target.value)} />
        </div>
        <div className="list-toolbar-actions"><span className="list-count">{data?.total ?? 0} kết quả</span>{toolbarActions}</div>
      </div>
      {loading ? (
        <div className="skeleton-list" aria-label="Đang tải">Đang tải dữ liệu...</div>
      ) : !items.length ? (
        <div className="empty-state">
          <Inbox size={38} />
          <h3>Chưa có dữ liệu</h3>
          <p>Thử từ khóa khác hoặc thêm bản ghi mới.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>{columns.map(c => <th key={c.key} className={`list-column-${c.key}`}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id ?? index} onClick={() => onRow?.(item)} className={onRow ? 'clickable' : ''}>
                    {columns.map(col => <td key={col.key} className={`list-column-${col.key}`} data-label={col.label}>{col.render ? col.render(item) : item[col.key] ?? '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={data?.total}
            pageSize={pageSize}
            onChange={onPage}
            label="kết quả"
          />
        </>
      )}
    </div>
  )
}
