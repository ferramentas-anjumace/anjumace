import { cn } from '../../lib/cn'
import { Eyebrow } from '../Section/Section'

/**
 * CTABlock — bloco de chamada para ação (final de página/seção).
 * - eyebrow, title, description
 * - actions: ReactNode (ex. <Button>…</Button>)
 * - tone: 'inverse' (grafite) | 'accent' (sálvia) | 'surface'
 * - align: 'center' | 'left'
 */
export function CTABlock({
  eyebrow,
  title,
  description,
  actions,
  tone = 'inverse',
  align = 'center',
  className,
  ...props
}) {
  const tones = {
    inverse: 'bg-surface-inverse text-content-inverse',
    accent: 'bg-accent text-accent-on',
    surface: 'bg-surface border border-subtle text-content',
  }
  return (
    <div
      className={cn(
        'rounded-3xl px-8 py-14 md:px-16 md:py-20',
        tones[tone],
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      <div className={cn('flex flex-col gap-5', align === 'center' && 'items-center')}>
        {eyebrow && <Eyebrow className={tone !== 'surface' ? 'text-current/80' : undefined}>{eyebrow}</Eyebrow>}
        {title && <h2 className="text-h1 max-w-3xl">{title}</h2>}
        {description && (
          <p className={cn('text-body-lg max-w-xl', tone === 'surface' ? 'text-content-secondary' : 'text-current/80')}>
            {description}
          </p>
        )}
        {actions && <div className="flex flex-wrap items-center gap-3 pt-2 justify-center">{actions}</div>}
      </div>
    </div>
  )
}
