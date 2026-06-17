import { cn } from '../../lib/cn'

/**
 * Chip — pílula de metadado. Suporta o estilo "glass" da marca
 * (sobre fotos: "45 minutos", "intermediário", etc.).
 *
 * - glass: usa a superfície de vidro + backdrop-blur
 * - icon: ReactNode opcional à esquerda
 * - onRemove: mostra botão de remover (chip de filtro)
 */
export function Chip({ glass = false, icon, onRemove, className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-xs font-medium',
        glass
          ? 'glass text-white'
          : 'bg-surface-sunken text-content-secondary border border-subtle',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover"
          className="ml-0.5 inline-grid place-items-center rounded-full size-4 hover:bg-black/10 transition-colors duration-fast"
        >
          <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
