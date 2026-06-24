import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const skeleton = cva(
  // shimmer percorre uma faixa clara sobre a superfície; respeita reduced-motion
  'relative overflow-hidden bg-slate-800 isolate',
  {
    variants: {
      shape: {
        line: 'h-3.5 rounded-xs',
        block: 'rounded-md',
        circle: 'rounded-full aspect-square',
      },
    },
    defaultVariants: { shape: 'line' },
  },
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeleton> {}

/**
 * Skeleton — placeholder com shimmer enquanto o conteúdo carrega. Formas:
 * line, block, circle.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden
      className={cn(skeleton({ shape }), className)}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--line)] to-transparent" />
    </div>
  ),
)
Skeleton.displayName = 'Skeleton'
