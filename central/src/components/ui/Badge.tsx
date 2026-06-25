import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badge = cva(['inline-flex items-center font-mono uppercase rounded-md border leading-none'], {
  variants: {
    tone: {
      neutral: '',
      steel: '',
      sand: '',
      success: '',
      danger: '',
      warning: '',
    },
    /**
     * Aparência:
     * - solid: fundo cheio e saturado (lê de longe a cor). Padrão.
     * - soft:  fundo tint discreto com texto colorido (uso pontual).
     */
    variant: {
      solid: 'border-transparent',
      soft: '',
    },
    size: {
      sm: 'h-5 gap-1 px-1.5 text-[10px] tracking-[0.08em]',
      md: 'h-6 gap-1.5 px-2 text-mono-label',
    },
  },
  compoundVariants: [
    // SOFT — tint discreto (texto colorido sobre fundo tênue)
    { variant: 'soft', tone: 'neutral', class: 'bg-slate-800 border-line text-muted' },
    { variant: 'soft', tone: 'steel', class: 'bg-steel-tint border-steel-500/30 text-steel-300' },
    { variant: 'soft', tone: 'sand', class: 'bg-sand-tint border-sand-300/30 text-sand-300' },
    { variant: 'soft', tone: 'success', class: 'bg-ok-tint border-ok/30 text-ok' },
    { variant: 'soft', tone: 'danger', class: 'bg-err-tint border-err/30 text-err' },
    { variant: 'soft', tone: 'warning', class: 'bg-warn-tint border-warn/30 text-warn' },
    // SOLID — fundo cheio (texto "knockout" que mantém contraste em ambos os temas)
    { variant: 'solid', tone: 'neutral', class: 'bg-slate-600 text-strong' },
    { variant: 'solid', tone: 'steel', class: 'bg-steel-500 text-accent-fg' },
    { variant: 'solid', tone: 'sand', class: 'bg-sand-300 text-on-sand' },
    { variant: 'solid', tone: 'success', class: 'bg-ok text-ink' },
    { variant: 'solid', tone: 'danger', class: 'bg-err text-ink' },
    { variant: 'solid', tone: 'warning', class: 'bg-warn text-ink' },
  ],
  defaultVariants: { tone: 'neutral', size: 'md', variant: 'solid' },
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
 * steel, sand, success, danger, warning. Por padrão usa fundo cheio (solid)
 * para boa leitura à distância; `variant="soft"` para o tint discreto. O dot
 * só aparece na variante soft (no solid o próprio fundo já comunica a cor).
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone, size, variant, dot = false, children, ...props }, ref) => {
    const showDot = dot && variant === 'soft'
    return (
      <span ref={ref} className={cn(badge({ tone, size, variant }), className)} {...props}>
        {showDot && (
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
