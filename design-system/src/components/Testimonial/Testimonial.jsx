import { cn } from '../../lib/cn'
import { Avatar } from '../Avatar/Avatar'
import { Rating } from '../SocialProof/SocialProof'

/**
 * Testimonial — depoimento de aluna.
 * - quote: texto do depoimento
 * - author, role, avatarSrc
 * - rating: estrelas (opcional)
 * - variant: 'card' | 'plain'
 */
export function Testimonial({
  quote,
  author,
  role,
  avatarSrc,
  rating,
  variant = 'card',
  className,
  ...props
}) {
  return (
    <figure
      className={cn(
        'flex flex-col gap-5',
        variant === 'card' && 'rounded-2xl bg-surface border border-subtle p-6 shadow-sm',
        className,
      )}
      {...props}
    >
      {rating != null && <Rating value={rating} />}
      <blockquote className="text-body-lg text-content-secondary leading-relaxed">
        “{quote}”
      </blockquote>
      <figcaption className="flex items-center gap-3 mt-auto">
        <Avatar name={author} src={avatarSrc} size="md" />
        <div className="flex flex-col">
          <span className="text-body-sm font-semibold text-content">{author}</span>
          {role && <span className="text-caption">{role}</span>}
        </div>
      </figcaption>
    </figure>
  )
}
