import { cn } from '../../lib/cn'

/**
 * BottomNav — barra de navegação flutuante do app, com ação central
 * destacada (círculo dourado). Padrão da área de membros.
 *
 * - items: [{ id, icon, label, action? }]  // action:true = botão central destacado
 * - active: id ativo
 * - onChange(id)
 *
 * Posicione com `fixed bottom-4 inset-x-4` no app real, ou inline no showcase.
 */
export function BottomNav({ items = [], active, onChange, className, ...props }) {
  return (
    <nav
      className={cn(
        'flex items-center justify-between gap-1 rounded-full',
        'bg-surface/90 backdrop-blur-md border border-subtle shadow-lg',
        'px-3 h-16',
        className,
      )}
      {...props}
    >
      {items.map((it) => {
        if (it.action) {
          return (
            <button
              key={it.id}
              onClick={() => onChange?.(it.id)}
              aria-label={it.label}
              className="grid place-items-center size-12 rounded-full bg-accent-2 text-accent-2-on shadow-md transition-transform duration-base ease-spring hover:scale-105 focus-visible:shadow-focus focus-visible:outline-none -my-1"
            >
              {it.icon}
            </button>
          )
        }
        const isActive = it.id === active
        return (
          <button
            key={it.id}
            onClick={() => onChange?.(it.id)}
            aria-label={it.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex flex-1 flex-col items-center justify-center gap-0.5 h-full rounded-full transition-colors duration-fast',
              isActive ? 'text-accent-text' : 'text-content-muted hover:text-content',
            )}
          >
            {it.icon}
            <span className="text-2xs font-medium">{it.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
