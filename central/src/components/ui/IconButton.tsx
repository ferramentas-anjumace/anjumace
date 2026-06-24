import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const iconButton = cva(
  [
    'inline-flex items-center justify-center shrink-0 select-none rounded-md',
    'transition-[background-color,box-shadow,border-color,color] duration-fast ease-out',
    'focus-visible:outline-none focus-visible:shadow-focus',
    'disabled:opacity-45 disabled:pointer-events-none',
    'active:translate-y-px',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-steel-500 text-accent-fg hover:bg-steel-400 active:bg-steel-600',
        secondary:
          'border border-strong text-strong hover:bg-slate-800 hover:border-line active:bg-slate-700',
        ghost: 'text-muted hover:bg-slate-800 hover:text-strong active:bg-slate-700',
        danger: 'text-err hover:bg-err-tint active:bg-err-tint',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButton> {
  /** Rótulo acessível obrigatório — o botão não tem texto visível. */
  'aria-label': string
  loading?: boolean
}

/**
 * IconButton — botão somente de ícone. Exige `aria-label`. Variantes
 * primary/secondary/ghost/danger e tamanhos sm/md/lg.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18
    return (
      <button
        ref={ref}
        className={cn(iconButton({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={iconSize} strokeWidth={1.5} aria-hidden />
        ) : (
          children
        )}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
