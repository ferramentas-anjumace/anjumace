import { cn } from '../../lib/cn'
import { Wordmark } from '../Brand/Wordmark'
import { Eyebrow } from '../Section/Section'

const tones = {
  cream: 'bg-cream-100 text-graphite-800',
  graphite: 'bg-graphite-800 text-cream-100',
  sage: 'bg-sage-400 text-graphite-900',
}

/**
 * Slide — base de slide 16:9 (capa/conteúdo/citação/encerramento).
 * Usa `tone` para alternar fundos da marca. `kicker`/`footer` opcionais.
 *
 * - tone: 'cream' | 'graphite' | 'sage'
 * - kicker: eyebrow no topo
 * - footer: bool/nó — mostra wordmark + nº (default wordmark)
 * - pageNumber
 */
export function Slide({ tone = 'cream', kicker, footer = true, pageNumber, className, children, ...props }) {
  const inverse = tone === 'graphite'
  return (
    <div
      className={cn('relative flex aspect-video w-full flex-col overflow-hidden rounded-xl border border-subtle p-10 shadow-md', tones[tone], className)}
      {...props}
    >
      {kicker && <Eyebrow className={cn('mb-auto', inverse && 'text-current/80')}>{kicker}</Eyebrow>}
      <div className={cn('flex flex-1 flex-col justify-center', kicker && 'flex-none')}>{children}</div>
      {footer && (
        <div className="mt-auto flex items-center justify-between pt-6">
          <Wordmark size="sm" tone={inverse ? 'inverse' : 'default'} />
          {pageNumber != null && <span className="text-2xs opacity-60 tabular-nums">{pageNumber}</span>}
        </div>
      )}
    </div>
  )
}

/** SlideCover — capa (título grande + subtítulo). */
export function SlideCover({ kicker, title, subtitle, tone = 'graphite', className }) {
  return (
    <Slide tone={tone} kicker={kicker} className={className}>
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-5xl font-light leading-tight tracking-tight text-balance">{title}</h2>
        {subtitle && <p className="text-lg opacity-80 max-w-xl">{subtitle}</p>}
      </div>
    </Slide>
  )
}

/** SlideContent — conteúdo (título + corpo/bullets). */
export function SlideContent({ kicker, title, children, tone = 'cream', className }) {
  return (
    <Slide tone={tone} kicker={kicker} className={className}>
      <div className="flex flex-col gap-5">
        {title && <h2 className="font-display text-3xl font-medium tracking-tight">{title}</h2>}
        <div className="text-base leading-relaxed opacity-90">{children}</div>
      </div>
    </Slide>
  )
}

/** SlideQuote — citação centralizada. */
export function SlideQuote({ quote, author, tone = 'sage', className }) {
  return (
    <Slide tone={tone} className={className}>
      <div className="flex flex-col items-center text-center gap-5">
        <p className="font-display text-4xl font-light leading-snug tracking-tight max-w-2xl text-balance">“{quote}”</p>
        {author && <span className="text-label opacity-70">{author}</span>}
      </div>
    </Slide>
  )
}

/** SlideClosing — encerramento (CTA/contato). */
export function SlideClosing({ title, subtitle, cta, tone = 'graphite', className }) {
  return (
    <Slide tone={tone} className={className}>
      <div className="flex flex-col items-center text-center gap-4">
        <h2 className="font-display text-4xl font-light tracking-tight">{title}</h2>
        {subtitle && <p className="text-lg opacity-80 max-w-lg">{subtitle}</p>}
        {cta && <span className="mt-2 inline-flex items-center rounded-full bg-sage-400 px-6 h-12 text-graphite-900 font-medium">{cta}</span>}
      </div>
    </Slide>
  )
}
