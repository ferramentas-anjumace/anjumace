import { Section, Eyebrow } from '../../../components'
import { SINGULARIDADE } from '../data'
import { CtaButton } from './CtaButton'
import { Reveal } from '../Reveal'
import { ImagePlaceholder } from '../ImagePlaceholder'

/**
 * Bloco 1 · A singularidade — hierarquia editorial: cabeçalho (eyebrow →
 * título → lead) abre a seção; abaixo, texto com régua dourada à esquerda
 * e foto à direita. Palavra-fantasma ao fundo.
 */
export function SingularidadeSection() {
  return (
    <Section id="singularidade" tone="base" padding="lg" className="relative overflow-hidden">
      <div className="relative flex flex-col gap-8 lg:gap-10">
        {/* Cabeçalho da seção — sempre primeiro na leitura */}
        <Reveal className="flex max-w-3xl flex-col gap-6">
          <Eyebrow>{SINGULARIDADE.eyebrow}</Eyebrow>
          <h2 className="text-h1 text-content">{SINGULARIDADE.title}</h2>
          <p className="font-display text-2xl font-light leading-snug text-accent-text">
            {SINGULARIDADE.lead}
          </p>
        </Reveal>

        {/* Corpo: texto + CTA à esquerda, foto à direita */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-8 border-l-2 border-accent-2/50 pl-8">
            {SINGULARIDADE.paragraphs.map((p, i) => (
              <Reveal key={i} delay={150 + i * 150}>
                <p className="text-body-lg text-content-secondary leading-relaxed">{p}</p>
              </Reveal>
            ))}
            <Reveal delay={450} className="pt-2">
              <CtaButton />
            </Reveal>
          </div>

          <Reveal variant="right" delay={250}>
            <ImagePlaceholder
              label="Foto: Anju avaliando uma aluna — a leitura do corpo em ação"
              size="1200 × 900 px · 4:3 · WebP"
              ratio="aspect-[4/3]"
            />
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
