import { ArrowRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Chip } from '../Chip/Chip'

/**
 * WorkoutCard — card de treino/aula com foto full-bleed, chip de vidro,
 * overlay de título e botão "Iniciar" (pill branco + seta). Padrão do app.
 *
 * - image, alt
 * - duration: texto do chip de vidro (ex. "45 minutos")
 * - kicker: rótulo pequeno acima do título (ex. "TREINO DE")
 * - title: título grande
 * - description
 * - ctaLabel (default "Iniciar"), onStart
 * - ratio: 'portrait' | 'video' | 'square'
 */
export function WorkoutCard({
  image,
  alt = '',
  duration,
  kicker,
  title,
  description,
  ctaLabel = 'Iniciar',
  onStart,
  ratio = 'portrait',
  className,
  ...props
}) {
  const ratios = { portrait: 'aspect-[3/4]', video: 'aspect-video', square: 'aspect-square' }
  return (
    <div
      className={cn('relative overflow-hidden rounded-3xl bg-graphite-800 text-white', ratios[ratio], className)}
      {...props}
    >
      {image && <img src={image} alt={alt} className="absolute inset-0 size-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/85 via-graphite-950/20 to-transparent" aria-hidden />

      {duration && <div className="absolute right-4 top-4"><Chip glass>{duration}</Chip></div>}

      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          {kicker && <span className="text-label text-white/70">{kicker}</span>}
          {title && <h3 className="font-display text-2xl font-medium leading-snug">{title}</h3>}
          {description && <p className="text-body-sm text-white/75 line-clamp-2">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onStart}
          className="group flex items-center justify-between gap-3 rounded-full bg-white pl-6 pr-2 h-12 text-graphite-900 font-medium transition-transform duration-base ease-spring active:scale-[0.98] focus-visible:shadow-focus focus-visible:outline-none"
        >
          <span>{ctaLabel}</span>
          <span className="grid place-items-center size-9 rounded-full bg-accent text-accent-on transition-transform duration-base group-hover:translate-x-0.5">
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
          </span>
        </button>
      </div>
    </div>
  )
}
