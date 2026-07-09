import { PenLine, Image as ImageIcon } from 'lucide-react'
import { Section, Eyebrow, Wordmark } from '../../../components'
import { CREDIBILIDADE } from '../data'
import { ConsultoraButton } from './CtaButton'
import { Reveal } from '../Reveal'

/**
 * Bloco 8 · A credibilidade — painel-assinatura com moldura dourada nos
 * cantos e orbe flutuando; texto entra em cascata pela direita.
 */
export function CredibilidadeSection() {
  return (
    <Section id="quem-prescreve" tone="warm" padding="lg">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        {/* ⚠️ Painel-assinatura provisório: trocar por um retrato real de Anju
            (sem texto de capa) quando a foto for definida. */}
        <Reveal variant="left" className="relative">
          {/* Moldura dourada nos cantos */}
          <span
            aria-hidden
            className="absolute -left-3 -top-3 size-16 rounded-tl-3xl border-l-2 border-t-2 border-accent-2/70"
          />
          <span
            aria-hidden
            className="absolute -bottom-3 -right-3 size-16 rounded-br-3xl border-b-2 border-r-2 border-accent-2/70"
          />

          <div className="relative flex aspect-[4/5] flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border-2 border-dashed border-white/25 bg-graphite-900 p-10 text-center shadow-xl">
            <div
              className="absolute inset-0 bg-gradient-to-br from-graphite-950 via-graphite-900 to-sage-900/60"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 top-1/4 size-64 animate-float-slow rounded-full bg-gold-500/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-col items-center gap-5">
              <ImageIcon className="size-10 text-white/50" strokeWidth={1.25} aria-hidden />
              <p className="max-w-[24ch] text-body text-white/80">
                Retrato oficial de Anju — sem texto gravado na foto
              </p>
              <p className="font-mono text-xs tracking-wide text-white/50">
                1080 × 1350 px · 4:5 · WebP
              </p>
              <span className="h-px w-16 bg-accent-2/60" aria-hidden />
              <Wordmark size="md" tone="inverse" />
              <p className="text-label text-white/60">
                Prescrição assinada individualmente
              </p>
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col gap-5">
          <Reveal variant="right">
            <Eyebrow>{CREDIBILIDADE.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal variant="right" delay={100}>
            <h2 className="text-h1 text-content">{CREDIBILIDADE.title}</h2>
          </Reveal>
          {CREDIBILIDADE.paragraphs.map((p, i) => (
            <Reveal key={i} variant="right" delay={200 + i * 120}>
              <p className="text-body-lg text-content-secondary leading-relaxed">{p}</p>
            </Reveal>
          ))}

          {/* ⚠️ Espaço reservado: credenciais verificadas de Anju (registro e
              formação). Substituir este placeholder antes da publicação. */}
          <Reveal variant="right" delay={440}>
            <div className="rounded-2xl border border-dashed border-strong bg-surface/60 p-6 text-body-sm text-content-subtle">
              Credenciais verificadas de Anju (registro e formação) — a confirmar antes da publicação.
            </div>
          </Reveal>

          <Reveal variant="right" delay={540}>
            <p className="flex items-center gap-3 text-h5 text-content">
              <span className="inline-grid size-10 shrink-0 place-items-center rounded-full bg-accent-subtle text-accent-text">
                <PenLine className="size-5" strokeWidth={1.5} />
              </span>
              {CREDIBILIDADE.closing}
            </p>
          </Reveal>

          <Reveal variant="right" delay={640} className="pt-4">
            <ConsultoraButton />
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
