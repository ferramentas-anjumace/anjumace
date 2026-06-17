import { cn } from '../../lib/cn'

const tones = {
  base: 'bg-surface-base text-content',
  surface: 'bg-surface text-content',
  muted: 'bg-surface-sunken text-content',
  warm: 'bg-surface-warm text-content',
  inverse: 'bg-surface-inverse text-content-inverse', // bloco escuro numa página clara
}

const paddings = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-24',
  lg: 'py-20 md:py-32',
}

/**
 * Section — invólucro de seção com tom, padding vertical e container central.
 * Base do ritmo editorial (whitespace generoso).
 *
 * - tone: base | surface | muted | warm | inverse
 * - padding: sm | md | lg
 * - container: bool (default true) — centraliza conteúdo a 1200px
 * - as: tag semântica ('section' default)
 */
export function Section({
  tone = 'base',
  padding = 'md',
  container = true,
  as: Comp = 'section',
  className,
  children,
  ...props
}) {
  return (
    <Comp className={cn(tones[tone], paddings[padding], className)} {...props}>
      {container ? <div className="container">{children}</div> : children}
    </Comp>
  )
}

/**
 * SectionHeader — eyebrow + título (com palavra-acento) + descrição.
 * Reproduz o padrão de abertura de seção do material.
 *
 * - eyebrow: label caixa-alta (ex. "Who we are")
 * - title: string ou ReactNode
 * - description
 * - align: 'left' | 'center'
 * - as: nível do heading ('h2' default)
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Heading = 'h2',
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 max-w-2xl',
        align === 'center' && 'items-center text-center mx-auto',
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-label text-accent-text">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          {eyebrow}
        </span>
      )}
      {title && <Heading className="text-h2">{title}</Heading>}
      {description && (
        <p className="text-body-lg text-content-secondary">{description}</p>
      )}
      {children}
    </div>
  )
}

/** Eyebrow — label de marca isolado (bullet + caixa-alta + tracking largo). */
export function Eyebrow({ className, children, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-label text-accent-text', className)}
      {...props}
    >
      <span className="size-1.5 rounded-full bg-accent" aria-hidden />
      {children}
    </span>
  )
}

/** Highlight — palavra/trecho com acento sálvia dentro de um título. */
export function Highlight({ className, children }) {
  return <span className={cn('text-accent-text', className)}>{children}</span>
}
