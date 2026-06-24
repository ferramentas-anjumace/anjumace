import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const button = cva(
  // base
  [
    'relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap',
    'font-sans font-medium rounded-md',
    'transition-[background-color,box-shadow,border-color,color,transform] duration-fast ease-out',
    'focus-visible:outline-none focus-visible:shadow-focus',
    'disabled:opacity-45 disabled:pointer-events-none',
    'active:translate-y-px',
  ],
  {
    variants: {
      variant: {
        // Steel — ação primária
        primary: [
          'bg-steel-500 text-accent-fg',
          'hover:bg-steel-400',
          'active:bg-steel-600',
        ],
        // Outline — secundária
        secondary: [
          'bg-transparent text-strong border border-strong',
          'hover:bg-slate-800 hover:border-line',
          'active:bg-slate-700',
        ],
        // Ghost
        ghost: [
          'bg-transparent text-fg',
          'hover:bg-slate-800 hover:text-strong',
          'active:bg-slate-700',
        ],
        // Sand — ênfase quente (a assinatura)
        sand: [
          'bg-sand-200 text-on-sand border border-sand-300',
          'hover:bg-sand-100',
          'active:bg-sand-300',
        ],
        // Danger
        danger: [
          'bg-transparent text-err border border-err/40',
          'hover:bg-err-tint hover:border-err/60',
          'active:bg-err-tint',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-body-s rounded-sm',
        md: 'h-10 px-4 text-body',
        lg: 'h-12 px-5 text-body-l',
      },
      iconOnly: {
        true: 'p-0 aspect-square',
        false: '',
      },
    },
    compoundVariants: [
      { iconOnly: true, size: 'sm', class: 'w-8' },
      { iconOnly: true, size: 'md', class: 'w-10' },
      { iconOnly: true, size: 'lg', class: 'w-12' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /** Ícone renderizado antes do label. */
  leftIcon?: React.ReactNode
  /** Ícone renderizado depois do label. */
  rightIcon?: React.ReactNode
  /** Exibe spinner e bloqueia interação. */
  loading?: boolean
}

/**
 * Botão base do sistema. Variantes: primary (steel), secondary, ghost,
 * sand (ênfase quente) e danger. Tamanhos sm/md/lg.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconOnly,
      leftIcon,
      rightIcon,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(button({ variant, size, iconOnly }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <Loader2
            className="animate-spin"
            size={size === 'lg' ? 20 : 18}
            strokeWidth={1.5}
            aria-hidden
          />
        )}
        {!loading && leftIcon}
        {children && <span className={cn(loading && 'opacity-0')}>{children}</span>}
        {!loading && rightIcon}
      </button>
    )
  },
)
Button.displayName = 'Button'
