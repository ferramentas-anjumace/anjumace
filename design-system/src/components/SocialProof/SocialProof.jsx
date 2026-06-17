import { Star } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Avatar } from '../Avatar/Avatar'

/** Linha de estrelas (rating). */
export function Rating({ value = 5, max = 5, size = 'md', className }) {
  const px = { sm: 'size-3', md: 'size-4', lg: 'size-5' }[size]
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} de ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(px, i < value ? 'fill-accent-2 text-accent-2' : 'text-content-subtle')}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  )
}

/**
 * SocialProof — pilha de avatares + rating + texto (card do hero do material).
 * - people: [{ name, src }]
 * - rating: número de estrelas
 * - label: texto (ex. "+2.000 alunas transformadas")
 * - variant: 'plain' | 'card' | 'glass'
 */
export function SocialProof({
  people = [],
  rating = 5,
  label,
  variant = 'plain',
  className,
  ...props
}) {
  const wrap = {
    plain: '',
    card: 'rounded-2xl bg-surface border border-subtle shadow-md p-4',
    glass: 'glass rounded-2xl p-4 text-white',
  }[variant]

  return (
    <div className={cn('inline-flex items-center gap-4', wrap, className)} {...props}>
      {people.length > 0 && (
        <div className="flex -space-x-3">
          {people.slice(0, 4).map((p, i) => (
            <Avatar
              key={i}
              name={p.name}
              src={p.src}
              size="sm"
              className="ring-2 ring-surface"
            />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <Rating value={rating} size="sm" />
        {label && <span className={cn('text-caption', variant === 'glass' && 'text-white/80')}>{label}</span>}
      </div>
    </div>
  )
}
