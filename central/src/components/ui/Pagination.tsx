import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** Total de itens, para o resumo "X–Y de Z". */
  totalItems?: number
  pageSize?: number
}

/** Gera a sequência de páginas com elipses. */
function range(page: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(count - 1, page + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < count - 1) pages.push('…')
  pages.push(count)
  return pages
}

/**
 * Pagination — navegação por páginas com elipses e resumo opcional de
 * intervalo. Usada no rodapé de tabelas e listas.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize = 10,
  className,
  ...props
}: PaginationProps) {
  const pages = range(page, pageCount)
  const from = (page - 1) * pageSize + 1
  const to = totalItems ? Math.min(page * pageSize, totalItems) : page * pageSize

  const navBtn =
    'grid h-8 min-w-8 place-items-center rounded-sm px-2 text-body-s transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:pointer-events-none'

  return (
    <nav
      aria-label="Paginação"
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
      {...props}
    >
      {totalItems !== undefined && (
        <p className="font-mono text-mono-data text-muted tabular-nums">
          {from}–{to} de {totalItems}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(navBtn, 'text-muted hover:bg-slate-800 hover:text-strong')}
        >
          <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="grid h-8 w-8 place-items-center text-faint">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                navBtn,
                'font-mono tabular-nums',
                p === page
                  ? 'bg-steel-tint text-steel-300'
                  : 'text-muted hover:bg-slate-800 hover:text-strong',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Próxima página"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className={cn(navBtn, 'text-muted hover:bg-slate-800 hover:text-strong')}
        >
          <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </nav>
  )
}
