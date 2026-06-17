import { cn } from '../../lib/cn'

/**
 * Stat — destaque numérico (ex. "+2.000 alunas", "98% de adesão").
 * - value: número/texto grande
 * - label: descrição abaixo
 * - align: 'left' | 'center'
 */
export function Stat({ value, label, align = 'left', className, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1', align === 'center' && 'items-center text-center', className)} {...props}>
      <span className="font-display text-5xl font-light tracking-tight text-content">{value}</span>
      {label && <span className="text-body-sm text-content-muted">{label}</span>}
    </div>
  )
}

/** StatGroup — fileira de stats com divisores opcionais. */
export function StatGroup({ className, children, ...props }) {
  return (
    <div className={cn('grid grid-cols-2 gap-8 md:grid-cols-4', className)} {...props}>
      {children}
    </div>
  )
}
