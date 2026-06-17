import { Bell } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Avatar } from '../Avatar/Avatar'
import { Badge } from '../Badge/Badge'

/**
 * ProfileHeader — cabeçalho do app: avatar (+VIP) · saudação/data · sino.
 * Reproduz o topo da área de membros do material.
 *
 * - name, src: avatar
 * - vip: aro/selo dourado
 * - greeting: linha superior (ex. "Terça, 19 Jul")
 * - title: linha principal (ex. "Meu treino")
 * - notifications: número (badge no sino) — 0/undefined oculta
 * - onBell: handler
 */
export function ProfileHeader({
  name,
  src,
  vip = false,
  greeting,
  title,
  notifications = 0,
  onBell,
  className,
  ...props
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={src} size="md" vip={vip} />
          <div className="flex flex-col">
            {vip && <Badge variant="accent-2" size="sm" uppercase className="self-start mb-0.5">VIP</Badge>}
            {greeting && <span className="text-caption">{greeting}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onBell}
          aria-label={`Notificações${notifications ? `: ${notifications}` : ''}`}
          className="relative grid place-items-center size-11 rounded-full bg-surface border border-subtle text-content-secondary transition-colors duration-fast hover:bg-surface-sunken focus-visible:shadow-focus focus-visible:outline-none"
        >
          <Bell className="size-5" strokeWidth={1.5} aria-hidden />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-danger text-white text-2xs font-semibold">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </button>
      </div>
      {title && <h1 className="text-h2">{title}</h1>}
    </div>
  )
}
