import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badge = cva(['inline-flex items-center font-mono uppercase rounded-md border leading-none'], {
  variants: {
    tone: {
      neutral: 'bg-slate-800 border-line text-muted',
      steel: 'bg-steel-tint border-steel-500/30 text-steel-300',
      sand: 'bg-sand-tint border-sand-300/30 text-sand-300',
      success: 'bg-ok-tint border-ok/30 text-ok',
      danger: 'bg-err-tint border-err/30 text-err',
      warning: 'bg-warn-tint border-warn/30 text-warn',
    },
    size: {
      sm: 'h-5 gap-1 px-1.5 text-[10px] tracking-[0.08em]',
      md: 'h-6 gap-1.5 px-2 text-mono-label',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
})

const dotColor: Record<NonNullable<VariantProps<typeof badge>['tone']>, string> = {
  neutral: 'bg-muted',
  steel: 'bg-steel-400',
  sand: 'bg-sand-300',
  success: 'bg-ok',
  danger: 'bg-err',
  warning: 'bg-warn',
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {
  /** Mostra um ponto colorido antes do label (status pill). */
  dot?: boolean
}

/**
 * Badge / StatusPill — rótulo de status em mono uppercase. Tons: neutral,
 * steel, success, danger, warning. Variante com dot para status.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone, size, dot = false, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badge({ tone, size }), className)} {...props}>
        {dot && (
          <span
            className={cn('size-1.5 rounded-full', dotColor[tone ?? 'neutral'])}
            aria-hidden
          />
        )}
        {children}
      </span>
    )
  },
)
Badge.displayName = 'Badge'
