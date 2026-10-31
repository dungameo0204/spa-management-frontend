import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Pagination.css'

export function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Pagination({ page = 1, totalPages = 1, totalItems, pageSize, onChange, label = 'mục', className = '' }) {
  if (totalPages <= 1 && (!totalItems || (pageSize && totalItems <= pageSize))) return null

  const current = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const pages = Math.max(1, totalPages)

  let startItem = null
  let endItem = null
  if (totalItems != null && pageSize) {
    startItem = (current - 1) * pageSize + 1
    endItem = Math.min(current * pageSize, totalItems)
  }

  return (
    <nav className={`app-pagination ${className}`.trim()} aria-label="Phân trang">
      <div className="app-pagination-info">
        {startItem && endItem ? (
          <>Hiển thị <strong>{startItem} - {endItem}</strong> trong <strong>{totalItems}</strong> {label}</>
        ) : (
          <>Trang <strong>{current}</strong> / <strong>{pages}</strong>{totalItems ? ` (${totalItems} ${label})` : ''}</>
        )}
      </div>
      <div className="app-pagination-controls">
        <button
          type="button"
          className="app-page-btn app-page-prev"
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
          <span>Trước</span>
        </button>
        <div className="app-page-numbers">
          {getPageNumbers(current, pages).map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="app-page-ellipsis">…</span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                className={`app-page-num${p === current ? ' is-active' : ''}`}
                onClick={() => onChange(p)}
                aria-current={p === current ? 'page' : undefined}
                aria-label={`Trang ${p}`}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          className="app-page-btn app-page-next"
          disabled={current >= pages}
          onClick={() => onChange(current + 1)}
          aria-label="Trang sau"
        >
          <span>Sau</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}

