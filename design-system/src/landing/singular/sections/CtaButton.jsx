import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components'
import { cn } from '../../../lib/cn'
import { CTA_URL, CTA_LABEL, CONSULTORA_URL, CTA_CONSULTORA_LABEL } from '../data'

/* Padrão da landing: texto dos botões sempre em caixa-alta. */
const caps = 'uppercase tracking-wide'

/** CTA primário da página — repetido ao fim de cada bloco, sempre igual. */
export function CtaButton({ size = 'lg', className }) {
  return (
    <Button
      as="a"
      href={CTA_URL}
      size={size}
      className={cn(caps, className)}
      rightIcon={<ArrowRight className="size-5" strokeWidth={1.5} />}
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
      className={cn(caps, className)}
      rightIcon={<ArrowRight className="size-5" strokeWidth={1.5} />}
    >
      {CTA_CONSULTORA_LABEL}
    </Button>
  )
}
