import { Section, CTABlock } from '../../../components'
import { FECHAMENTO } from '../data'
import { CtaButton } from './CtaButton'
import { Reveal } from '../Reveal'

/** Fechamento — última chamada antes do rodapé, com brilho por trás do bloco. */
export function FechamentoSection() {
  return (
    <Section tone="base" padding="md" className="relative overflow-hidden">
      {/* Brilho dourado difuso atrás do bloco escuro */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 animate-float-slow rounded-full bg-gold-400/20 blur-3xl"
        aria-hidden
      />

      <Reveal variant="scale" duration={900} className="relative">
        <CTABlock
          tone="inverse"
          eyebrow="Prescrição Singular"
          title={FECHAMENTO.title}
          description={FECHAMENTO.description}
          actions={<CtaButton />}
        />
      </Reveal>
    </Section>
  )
}
