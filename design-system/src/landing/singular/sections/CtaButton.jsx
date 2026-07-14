import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components'
import { cn } from '../../../lib/cn'
import { CTA_URL, CTA_LABEL, CONSULTORA_URL, CTA_CONSULTORA_LABEL } from '../data'

/* Padrão da landing: texto dos botões sempre em caixa-alta. */
const caps = 'uppercase tracking-wide'

/* Mesmo gradiente animado dos CTAs das páginas de obrigado (ObrigadoTemplate):
   sálvia → creme → sálvia; no hover o gradiente desliza (background-position). */
export const ctaGradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

/** CTA primário da página — repetido ao fim de cada bloco, sempre igual.
    h-auto/whitespace-normal: em telas estreitas o rótulo quebra em vez de
    estourar a lateral (mesma solução das páginas de obrigado). */
export function CtaButton({ size = 'lg', className }) {
  return (
    <Button
      as="a"
      href={CTA_URL}
      size={size}
      className={cn(caps, ctaGradient, 'h-auto max-w-full whitespace-normal py-3.5 leading-snug max-md:px-5 max-md:text-sm', className)}
      rightIcon={<ArrowRight className="size-5 shrink-0" strokeWidth={1.5} />}
    >
      {CTA_LABEL}
    </Button>
  )
}

/** CTA secundário — fala com a consultora (blocos 7 e 8). */
export function ConsultoraButton({ size = 'lg', variant = 'secondary', className }) {
  return (
    <Button
      as="a"
      href={CONSULTORA_URL}
      size={size}
      variant={variant}
      className={cn(caps, 'h-auto max-w-full whitespace-normal py-3.5 leading-snug', className)}
      rightIcon={<ArrowRight className="size-5 shrink-0" strokeWidth={1.5} />}
    >
      {CTA_CONSULTORA_LABEL}
    </Button>
  )
}
