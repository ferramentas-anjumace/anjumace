import { cn } from '../../lib/cn'
import { Button } from '../Button/Button'
import { Input } from '../Input/Input'

/**
 * LeadCapture — bloco de captura de e-mail.
 * - title, description
 * - layout: 'inline' (input + botão lado a lado) | 'stacked'
 * - ctaLabel, placeholder
 * - note: texto fino abaixo (LGPD/privacidade)
 * - onSubmit(e)
 * - tone: 'surface' | 'inverse'
 */
export function LeadCapture({
  title,
  description,
  layout = 'inline',
  ctaLabel = 'Quero participar',
  placeholder = 'Seu melhor e-mail',
  note,
  onSubmit,
  tone = 'surface',
  className,
  ...props
}) {
  const inverse = tone === 'inverse'
  return (
    <div
      className={cn(
        'rounded-3xl p-8 md:p-10',
        inverse ? 'bg-surface-inverse text-content-inverse' : 'bg-surface border border-subtle',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-2 mb-6 max-w-xl">
        {title && <h3 className="text-h3">{title}</h3>}
        {description && (
          <p className={cn('text-body', inverse ? 'text-current/80' : 'text-content-secondary')}>{description}</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.(e)
        }}
        className={cn('flex gap-3', layout === 'inline' ? 'flex-col sm:flex-row sm:items-end' : 'flex-col max-w-md')}
      >
        <Input
          type="email"
          required
          placeholder={placeholder}
          aria-label="E-mail"
          className="sm:min-w-[18rem]"
        />
        <Button type="submit" size="lg" className={layout === 'inline' ? 'sm:shrink-0' : 'w-full'}>
          {ctaLabel}
        </Button>
      </form>

      {note && (
        <p className={cn('text-caption mt-4', inverse && 'text-current/60')}>{note}</p>
      )}
    </div>
  )
}
