import { cn } from '../../lib/cn'

const sizes = {
  xs: 'size-7 text-2xs',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
}

const statusColors = {
  online: 'bg-success',
  offline: 'bg-graphite-300',
  busy: 'bg-danger',
}

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/**
 * Avatar — foto de perfil ou iniciais.
 * - src / alt: imagem
 * - name: usado p/ iniciais quando não há imagem
 * - size: xs | sm | md | lg | xl
 * - vip: aro dourado (membro VIP)
 * - status: 'online' | 'offline' | 'busy' — dot indicador
 */
export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  vip = false,
  status,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-surface-sunken text-content-secondary font-medium uppercase',
        vip && 'ring-2 ring-accent-2 ring-offset-2 ring-offset-surface',
        sizes[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? name ?? ''} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block size-1/4 rounded-full border-2 border-surface',
            statusColors[status],
          )}
          aria-label={status}
        />
      )}
    </span>
  )
}
