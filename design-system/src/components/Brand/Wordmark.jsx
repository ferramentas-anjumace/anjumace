import { cn } from '../../lib/cn'

const sizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
}

/**
 * Wordmark — assinatura "ANJU MACE" (ANJU forte + MACE leve, tracking largo).
 * - size: sm | md | lg | xl
 * - tone: 'default' | 'inverse' (sobre fundo escuro)
 */
export function Wordmark({ size = 'md', tone = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'font-display tracking-wider whitespace-nowrap',
        sizes[size],
        tone === 'inverse' ? 'text-white' : 'text-content',
        className,
      )}
      aria-label="Anju Mace"
      {...props}
    >
      <span className="font-bold">ANJU</span>
      <span className="font-light"> MACE</span>
    </span>
  )
}
