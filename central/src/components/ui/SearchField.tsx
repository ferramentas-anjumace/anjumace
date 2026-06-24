import { forwardRef, useId } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { controlClasses } from './Field'

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Rótulo acessível (visualmente oculto se não houver label visível). */
  'aria-label'?: string
  /** Mostra botão de limpar quando há valor. */
  onClear?: () => void
}

/**
 * SearchField — campo de busca com ícone líder e botão de limpar. Pensado
 * para a Topbar e filtros de tabela.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, onClear, value, placeholder = 'Buscar', id, ...props }, ref) => {
    const reactId = useId()
    const fieldId = id ?? reactId
    const hasValue = value !== undefined && value !== ''
    return (
      <div className={cn('relative flex items-center', className)}>
        <Search
          size={18}
          strokeWidth={1.5}
          className="pointer-events-none absolute left-3 text-muted"
          aria-hidden
        />
        <input
          ref={ref}
          id={fieldId}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={props['aria-label'] ?? placeholder}
          className={cn(
            controlClasses(false, 'h-10 pl-9 pr-9'),
            '[&::-webkit-search-cancel-button]:hidden',
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={onClear}
            className="absolute right-2.5 grid size-5 place-items-center rounded-full text-muted transition-colors hover:bg-slate-700 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
          >
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
    )
  },
)
SearchField.displayName = 'SearchField'
