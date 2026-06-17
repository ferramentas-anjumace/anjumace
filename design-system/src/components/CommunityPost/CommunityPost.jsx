import { Heart, MessageCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Avatar } from '../Avatar/Avatar'

/**
 * CommunityPost — card de post da comunidade (feed da área de membros).
 * - author, role, avatarSrc, time
 * - text: conteúdo
 * - image: foto opcional
 * - likes, comments: contadores
 * - liked: estado curtido
 * - onLike, onComment
 */
export function CommunityPost({
  author,
  role,
  avatarSrc,
  time,
  text,
  image,
  likes = 0,
  comments = 0,
  liked = false,
  onLike,
  onComment,
  className,
  ...props
}) {
  return (
    <article className={cn('flex flex-col gap-3 rounded-2xl bg-surface border border-subtle p-4', className)} {...props}>
      <header className="flex items-center gap-3">
        <Avatar name={author} src={avatarSrc} size="sm" />
        <div className="flex min-w-0 flex-col">
          <span className="text-body-sm font-semibold text-content truncate">{author}</span>
          <span className="text-caption truncate">{[role, time].filter(Boolean).join(' · ')}</span>
        </div>
      </header>

      {text && <p className="text-body-sm text-content-secondary leading-relaxed">{text}</p>}
      {image && (
        <img src={image} alt="" className="aspect-video w-full rounded-xl object-cover" />
      )}

      <footer className="flex items-center gap-5 pt-1">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          className={cn(
            'inline-flex items-center gap-1.5 text-caption transition-colors duration-fast',
            liked ? 'text-danger-text' : 'text-content-muted hover:text-content',
          )}
        >
          <Heart className={cn('size-4', liked && 'fill-current')} strokeWidth={1.5} aria-hidden />
          {likes}
        </button>
        <button
          type="button"
          onClick={onComment}
          className="inline-flex items-center gap-1.5 text-caption text-content-muted hover:text-content transition-colors duration-fast"
        >
          <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
          {comments}
        </button>
      </footer>
    </article>
  )
}
