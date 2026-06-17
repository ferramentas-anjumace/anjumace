import { cn } from '../../lib/cn'
import { Eyebrow } from '../Section/Section'

/**
 * Hero — abertura editorial. Suporta o padrão do material: foto full-bleed
 * escura + headline leve grande + dual CTA + prova social.
 *
 * - eyebrow, title, description
 * - actions: ReactNode (CTAs)
 * - aside: ReactNode (ex. <SocialProof variant="glass" />)
 * - image: URL de fundo (ativa modo "imersivo" escuro)
 * - overlay: intensidade do scrim sobre a foto (0–100)
 * - align: 'left' | 'center'
 * - minH: classe de altura mínima
 */
export function Hero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  image,
  overlay = 55,
  align = 'left',
  minH = 'min-h-[640px]',
  className,
  children,
  ...props
}) {
  const immersive = Boolean(image)

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        immersive ? 'bg-graphite-900 text-white' : 'bg-surface-base text-content',
        className,
      )}
      {...props}
    >
      {immersive && (
        <>
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
          <div
            className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-graphite-950/40 to-graphite-950/20"
            style={{ opacity: overlay / 100 }}
            aria-hidden
          />
        </>
      )}

      <div className={cn('container relative flex items-center', minH, 'py-20')}>
        <div
          className={cn(
            'flex w-full flex-col gap-6',
            align === 'center' ? 'items-center text-center max-w-3xl mx-auto' : 'max-w-2xl',
          )}
        >
          {eyebrow && <Eyebrow className={immersive ? 'text-white/80' : undefined}>{eyebrow}</Eyebrow>}
          {title && (
            <h1 className={cn('text-display-sm md:text-display', immersive && 'text-white')}>{title}</h1>
          )}
          {description && (
            <p className={cn('text-body-lg max-w-xl', immersive ? 'text-white/80' : 'text-content-secondary')}>
              {description}
            </p>
          )}
          {actions && <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div>}
          {aside && <div className="pt-6">{aside}</div>}
          {children}
        </div>
      </div>
    </section>
  )
}
