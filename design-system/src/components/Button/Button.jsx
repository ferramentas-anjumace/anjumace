import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

/* Variantes visuais — só tokens semânticos, nunca hex. */
const variants = {
  primary:
    'bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-active shadow-sm',
  secondary:
    'bg-accent-2 text-accent-2-on hover:bg-accent-2-hover active:bg-accent-2-active shadow-sm',
  outline:
    'border border-strong text-content bg-transparent hover:bg-surface-sunken active:bg-surface-muted',
  ghost:
    'text-content bg-transparent hover:bg-surface-sunken active:bg-surface-muted',
  link:
    'text-accent-text bg-transparent underline-offset-4 hover:underline px-0 h-auto shadow-none',
  danger:
    'bg-danger text-white hover:opacity-90 active:opacity-100 shadow-sm',
}

const sizes = {
  sm: 'h-9 px-4 text-body-sm gap-1.5',
  md: 'h-11 px-6 text-body-sm gap-2',
  lg: 'h-[3.25rem] px-8 text-base gap-2',
}

const iconOnlySizes = {
  sm: 'h-9 w-9 p-0',
  md: 'h-11 w-11 p-0',
  lg: 'h-[3.25rem] w-[3.25rem] p-0',
}

/**
 * Button — botão pill da marca.
 *
 * Props
 * - variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger'
 * - size: 'sm' | 'md' | 'lg'
 * - leftIcon / rightIcon: ReactNode (ex. ícone Lucide)
 * - iconOnly: boolean — botão circular só com ícone (use aria-label!)
 * - loading: boolean — mostra spinner e desabilita
 * - fullWidth: boolean
 * - as: elemento ('button' | 'a' | …) para render polimórfico
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    iconOnly = false,
    loading = false,
    fullWidth = false,
    disabled = false,
    as: Comp = 'button',
    className,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <Comp
      ref={ref}
      disabled={Comp === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        'whitespace-nowrap select-none',
        'transition-[background-color,box-shadow,opacity,transform] duration-fast ease-standard',
        'active:scale-[0.98] focus-visible:shadow-focus focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        iconOnly ? iconOnlySizes[size] : variant !== 'link' && sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {!loading && leftIcon}
      {!iconOnly && children}
      {!loading && rightIcon}
    </Comp>
  )
})
