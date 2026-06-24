import { forwardRef } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Table — conjunto composável de primitivos de tabela. Header sticky e
 * ordenável (labels em mono), hover e seleção de linha, célula de status,
 * empty state e rodapé para paginação.
 *
 * Composição:
 *   <Table>
 *     <TableHead><TableRow>...<TableHeaderCell sortable .../></TableRow></TableHead>
 *     <TableBody><TableRow selected>...<TableCell/></TableRow></TableBody>
 *     <TableFooter>...</TableFooter>
 *   </Table>
 */

export const Table = forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto rounded-lg border border-line">
      <table
        ref={ref}
        className={cn('w-full border-collapse text-body-s', className)}
        {...props}
      />
    </div>
  ),
)
Table.displayName = 'Table'

export const TableHead = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('sticky top-0 z-sticky bg-slate-800/95 backdrop-blur', className)}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <tbody ref={ref} className={className} {...props} />)
TableBody.displayName = 'TableBody'

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
  /** Habilita o hover de linha clicável. */
  interactive?: boolean
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, interactive, ...props }, ref) => (
    <tr
      ref={ref}
      data-selected={selected || undefined}
      className={cn(
        'border-b border-subtle last:border-0 transition-colors duration-fast',
        selected ? 'bg-steel-tint' : 'hover:bg-slate-800/60',
        interactive && 'cursor-pointer',
        className,
      )}
      {...props}
    />
  ),
)
TableRow.displayName = 'TableRow'

type SortDirection = 'asc' | 'desc' | false

export interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  /** 'asc' | 'desc' | false (não ordenado por esta coluna). */
  sortDirection?: SortDirection
  onSort?: () => void
  align?: 'left' | 'right' | 'center'
}

export const TableHeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className, sortable, sortDirection = false, onSort, align = 'left', children, ...props }, ref) => {
    const ariaSort = sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'
    const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown
    return (
      <th
        ref={ref}
        scope="col"
        aria-sort={sortable ? ariaSort : undefined}
        className={cn(
          'whitespace-nowrap border-b border-line px-3 py-2.5 font-mono text-mono-label uppercase text-muted',
          align === 'right' && 'text-right',
          align === 'center' && 'text-center',
          align === 'left' && 'text-left',
          className,
        )}
        {...props}
      >
        {sortable ? (
          <button
            type="button"
            onClick={onSort}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xs transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus',
              align === 'right' && 'flex-row-reverse',
              sortDirection && 'text-strong',
            )}
          >
            {children}
            <SortIcon size={13} strokeWidth={1.5} aria-hidden />
          </button>
        ) : (
          children
        )}
      </th>
    )
  },
)
TableHeaderCell.displayName = 'TableHeaderCell'

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center'
  /** Aplica tratamento mono/tabular (IDs, números, datas). */
  mono?: boolean
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', mono, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-3 py-2.5 text-body text-fg align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        mono && 'font-mono text-mono-data tabular-nums text-muted',
        className,
      )}
      {...props}
    />
  ),
)
TableCell.displayName = 'TableCell'

export function TableFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-t border-line bg-slate-900 px-3 py-2.5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TableEmptyProps {
  colSpan: number
  children: React.ReactNode
}

/** Linha de empty state ocupando toda a largura da tabela. */
export function TableEmpty({ colSpan, children }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center">
        {children}
      </td>
    </tr>
  )
}
