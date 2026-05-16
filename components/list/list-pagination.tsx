'use client'

import { Icon } from '@/components/ui/icon'

interface ListPaginationProps {
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

export function ListPagination({
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
}: ListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="list-pagination">
      <span className="muted text-sm">
        {total}건 표시 · 페이지 {page} / {totalPages}
      </span>
      <div className="flex gap-1" style={{ marginLeft: 'auto' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          <Icon name="chevL" size={11} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minWidth: 28 }}
            onClick={() => onPageChange(p)}
            aria-label={`${p}페이지`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          <Icon name="chevR" size={11} />
        </button>
      </div>
      <select
        className="select btn-sm"
        style={{ width: 90 }}
        value={perPage}
        onChange={(e) => {
          onPerPageChange(Number(e.target.value))
          onPageChange(1)
        }}
      >
        <option value={10}>10건씩</option>
        <option value={20}>20건씩</option>
        <option value={50}>50건씩</option>
        <option value={100}>100건씩</option>
      </select>
    </div>
  )
}
