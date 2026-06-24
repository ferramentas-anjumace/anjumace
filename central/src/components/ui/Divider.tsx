import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  /** Texto opcional centralizado sobre a linha (só horizontal). */
  label?: React.ReactNode
}

/**
 * Divider — separador em hairline. Horizontal ou vertical, com rótulo
 * opcional em mono.
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = 'horizontal', label, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn('mx-1 h-full w-px self-stretch bg-[var(--line)]', className)}
          {...props}
        />
      )
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          className={cn('flex items-center gap-3', className)}
          {...props}
        >
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span className="font-mono text-mono-label uppercase text-faint">{label}</span>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn('h-px w-full bg-[var(--line)]', className)}
        {...props}
      />
    )
  },
)
Divider.displayName = 'Divider'
