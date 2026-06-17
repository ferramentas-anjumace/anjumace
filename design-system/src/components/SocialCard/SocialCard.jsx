import { cn } from '../../lib/cn'
import { Wordmark } from '../Brand/Wordmark'

const formats = {
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
  story: 'aspect-[9/16]',
}
const tones = {
  cream: 'bg-cream-100 text-graphite-800',
  graphite: 'bg-graphite-800 text-cream-100',
  sage: 'bg-sage-400 text-graphite-900',
  photo: 'bg-graphite-900 text-white',
}

/**
 * SocialCard — criativo social (feed/story). Tile editorial de citação ou
 * sobre foto, com wordmark. Reproduz os posts do material.
 *
 * - format: 'square' (1:1) | 'portrait' (4:5) | 'story' (9:16)
 * - tone: 'cream' | 'graphite' | 'sage' | 'photo'
 * - image: foto de fundo (use com tone="photo")
 * - kicker, title, footer
 */
export function SocialCard({
  format = 'portrait',
  tone = 'cream',
  image,
  kicker,
  title,
  footer = true,
  className,
  children,
  ...props
}) {
  const onPhoto = tone === 'photo'
  return (
    <div
      className={cn('relative flex w-full flex-col overflow-hidden rounded-xl border border-subtle p-7 shadow-md', formats[format], tones[tone], className)}
      {...props}
    >
      {onPhoto && image && (
        <>
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/80 via-graphite-950/30 to-graphite-950/10" aria-hidden />
        </>
      )}
      <div className="relative flex flex-1 flex-col justify-center gap-3">
        {kicker && <span className={cn('text-label', onPhoto ? 'text-white/70' : 'opacity-60')}>{kicker}</span>}
        {title && <p className="font-display text-3xl font-light leading-snug tracking-tight text-balance">{title}</p>}
        {children}
      </div>
      {footer && (
        <div className="relative mt-auto pt-4">
          <Wordmark size="sm" tone={onPhoto || tone === 'graphite' ? 'inverse' : 'default'} />
        </div>
      )}
    </div>
  )
}
