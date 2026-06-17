import { Play } from 'lucide-react'
import { cn } from '../../lib/cn'

const ratios = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
}

/**
 * MediaPlayer — superfície de mídia (foto/vídeo) com botão play de vidro.
 * Reproduz o player do material (cantos arredondados + glass play).
 *
 * - image: URL de capa (ou passe children para conteúdo custom)
 * - alt
 * - ratio: 'video' | 'square' | 'portrait'
 * - chip: ReactNode (ex. <Chip glass>12:30</Chip>) no canto
 * - onPlay: handler do botão
 */
export function MediaPlayer({
  image,
  alt = '',
  ratio = 'video',
  chip,
  onPlay,
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-graphite-800',
        ratios[ratio],
        className,
      )}
      {...props}
    >
      {image && <img src={image} alt={alt} className="absolute inset-0 size-full object-cover" />}
      {children}
      <div className="absolute inset-0 bg-graphite-950/20" aria-hidden />
      <button
        type="button"
        onClick={onPlay}
        aria-label="Reproduzir vídeo"
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'grid place-items-center size-16 rounded-full glass text-white',
          'transition-transform duration-base ease-spring hover:scale-105',
          'focus-visible:shadow-focus focus-visible:outline-none',
        )}
      >
        <Play className="size-6 translate-x-0.5 fill-white" strokeWidth={1} aria-hidden />
      </button>
      {chip && <div className="absolute right-4 top-4">{chip}</div>}
    </div>
  )
}
