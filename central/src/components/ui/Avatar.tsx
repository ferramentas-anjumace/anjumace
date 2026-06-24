import { forwardRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const avatar = cva(
  'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-slate-700 font-mono font-medium uppercase text-strong',
  {
    variants: {
      size: {
        xs: 'size-6 text-[10px]',
        sm: 'size-8 text-[11px]',
        md: 'size-10 text-mono-data',
        lg: 'size-12 text-body',
        xl: 'size-16 text-body-l',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

type StatusTone = 'online' | 'busy' | 'away' | 'offline'

const statusColor: Record<StatusTone, string> = {
  online: 'bg-ok',
  busy: 'bg-err',
  away: 'bg-warn',
  offline: 'bg-slate-600',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2)
  return (parts[0][0] + parts[parts.length - 1][0]).slice(0, 2)
}

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatar> {
  /** Nome usado para gerar iniciais e alt. */
  name: string
  src?: string
  /** Ponto de status no canto. */
  status?: StatusTone
}

/**
 * Avatar — imagem com fallback de iniciais. Tamanhos xs–xl e ponto de status
 * opcional.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, name, src, status, ...props }, ref) => {
    const [errored, setErrored] = useState(false)
    const showImg = src && !errored
    return (
      <span ref={ref} className={cn(avatar({ size }), className)} {...props}>
        {showImg ? (
          <img
            src={src}
            alt={name}
            className="size-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span aria-hidden>{initials(name)}</span>
        )}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--ink)]',
              size === 'xs' || size === 'sm' ? 'size-2' : 'size-2.5',
              statusColor[status],
            )}
            title={status}
          />
        )}
      </span>
    )
  },
)
Avatar.displayName = 'Avatar'

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Limite visível; o excedente vira um contador "+N". */
  max?: number
}

/**
 * AvatarGroup — empilha avatares sobrepostos com contador de excedente.
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 4, children, ...props }, ref) => {
    const items = Array.isArray(children) ? children : [children]
    const visible = items.slice(0, max)
    const overflow = items.length - visible.length
    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        <div className="flex -space-x-1.5">
          {visible.map((child, i) => (
            <div key={i} className="rounded-full ring-2 ring-[var(--ink)]">
              {child}
            </div>
          ))}
        </div>
        {overflow > 0 && (
          <span className="ml-2 font-mono text-mono-data text-muted tabular-nums">
            +{overflow}
          </span>
        )}
      </div>
    )
  },
)
AvatarGroup.displayName = 'AvatarGroup'
