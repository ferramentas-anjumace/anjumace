import { cn } from '../../lib/cn'
import { Eyebrow } from '../Section/Section'

/**
 * QuizResult — tela de resultado do quiz.
 * - eyebrow: ex. "Seu perfil"
 * - title: nome do resultado (ex. "Construtora de Força")
 * - description
 * - media: ReactNode (ícone/ilustração/anel) no topo
 * - meta: ReactNode (ex. lista de recomendações, stats)
 * - actions: ReactNode (CTA)
 * - tone: 'surface' | 'inverse' | 'accent'
 */
export function QuizResult({
  eyebrow = 'Seu resultado',
  title,
  description,
  media,
  meta,
  actions,
  tone = 'surface',
  className,
  ...props
}) {
  const tones = {
    surface: 'bg-surface border border-subtle text-content',
    inverse: 'bg-surface-inverse text-content-inverse',
    accent: 'bg-accent-subtle text-content',
  }
  return (
    <div
      className={cn('flex flex-col items-center gap-6 rounded-3xl px-8 py-12 text-center', tones[tone], className)}
      {...props}
    >
      {media && <div className="animate-scale-in">{media}</div>}
      <div className="flex flex-col items-center gap-3">
        <Eyebrow className={tone === 'inverse' ? 'text-current/80' : undefined}>{eyebrow}</Eyebrow>
        {title && <h2 className="text-h1 max-w-xl">{title}</h2>}
        {description && (
          <p className={cn('text-body-lg max-w-md', tone === 'inverse' ? 'text-current/80' : 'text-content-secondary')}>
            {description}
          </p>
        )}
      </div>
      {meta && <div className="w-full max-w-md">{meta}</div>}
      {actions && <div className="flex flex-wrap items-center justify-center gap-3 pt-2">{actions}</div>}
    </div>
  )
}
