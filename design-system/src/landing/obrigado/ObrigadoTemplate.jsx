import { useEffect } from 'react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { Button, Section } from '../../components'
import { Reveal } from '../singular/Reveal'

/* Padrão da landing: texto dos botões sempre em caixa-alta. */
const caps = 'uppercase tracking-wide'

/* Ícones das lojas — logos de marca (Google Play / App Store), que não
   existem no Lucide. Paths do Font Awesome Brands, fill herda a cor do texto. */
function GooglePlayIcon({ className }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" className={className} aria-hidden>
      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
  )
}

function AppleIcon({ className }) {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}

/* Gradiente de marca dos CTAs — sálvia → bege visível em repouso; no hover
   o gradiente desliza (background-position), transição suave sem troca seca. */
const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

/**
 * Hero de confirmação — selo com check, entrada escalonada do conteúdo,
 * orbes de luz flutuando e cue apontando para os passos.
 */
function ConfirmacaoHero({ hero, bg }) {
  return (
    <section className="relative overflow-hidden bg-graphite-900 text-white">
      {/* Uma foto por dispositivo via <picture> — o navegador baixa SÓ a do
          formato atual (dois <img> com display:none baixavam os dois arquivos).
          Desktop: Anju à direita, enquadre 0%/25%, pulsação lenta (18s).
          Mobile: foto vertical, Anju no topo, pulsação mais rápida (10s) —
          em tela pequena o ciclo de 18s parece parado. */}
      <picture>
        <source media="(min-width: 768px)" srcSet={bg.desktop} />
        <img
          src={bg.mobile}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full animate-[breathe_10s_ease-in-out_infinite] object-cover object-top md:animate-breathe md:object-[0%_25%]"
        />
      </picture>
      {/* Véu escuro sobre a foto para manter o texto legível (só desktop). */}
      <div
        className="absolute inset-0 hidden bg-gradient-to-r from-graphite-950/90 via-graphite-950/55 to-graphite-950/25 md:block"
        aria-hidden
      />

      {/* Orbes de luz — profundidade e movimento contínuo sutil. */}
      <div
        className="pointer-events-none absolute -left-32 top-1/4 size-96 animate-float-slow rounded-full bg-sage-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-[10%] size-80 animate-float rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />

      {/* Logo da marca no topo da dobra — substitui o header. */}
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-10">
        <img src="/logo-anju.svg" alt="Anju Mace" className="h-4 w-auto animate-fade-in" />
      </div>

      <div className="container relative flex items-center justify-center pb-16 pt-24 md:pb-20 md:pt-28">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
          {/* Selo de confirmação — check com halo pulsando devagar. */}
          <span className="relative inline-grid animate-scale-in place-items-center">
            <span
              className="absolute inset-0 animate-float-slow rounded-full bg-accent/30 blur-xl"
              aria-hidden
            />
            <span className="relative inline-grid size-12 place-items-center rounded-full bg-accent text-accent-on shadow-lg md:size-16">
              <Check className="size-6 md:size-8" strokeWidth={2} aria-hidden />
            </span>
          </span>

          <span className="inline-flex animate-fade-in-up items-center gap-3 text-label text-accent [animation-delay:120ms]">
            <span className="h-px w-10 bg-accent/70" aria-hidden />
            {hero.eyebrow}
            <span className="h-px w-10 bg-accent/70" aria-hidden />
          </span>

          <h1 className="animate-fade-in-up text-display-sm text-white [animation-delay:240ms] md:text-display">
            {hero.title}
          </h1>

          <p className="animate-fade-in-up text-body-lg text-white/80 [animation-delay:380ms]">
            {hero.descriptionPart1}
            <br className="md:hidden" />
            <span className="hidden md:inline">{' '}</span>
            {hero.descriptionPart2}
            <br />
            {hero.descriptionPart3}
          </p>

          <div className="animate-fade-in-up pt-2 [animation-delay:520ms]">
            <Button
              as="a"
              href="#passos"
              size="lg"
              className={`${caps} ${gradient} h-auto max-w-full whitespace-normal px-6 py-3.5 text-sm leading-snug md:px-8 md:text-base`}
              rightIcon={<ChevronDown className="size-5 shrink-0 animate-cue" strokeWidth={1.5} />}
            >
              <span className="text-center">
                {hero.kickerLine1}
                <br className="md:hidden" />
                <span className="hidden md:inline">{' '}</span>
                {hero.kickerLine2}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Os dois passos — cards numerados no padrão da timeline do Singular. */
function PassosSection({ passos, labels, urls, aviso, fechamento }) {
  const [passo1, passo2] = passos

  return (
    <Section id="passos" tone="base" padding="lg">
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Passo 1 · App do Circle */}
        <Reveal
          className="group flex flex-col gap-5 rounded-2xl border border-subtle bg-surface p-8 shadow-sm transition-[transform,box-shadow] duration-moderate ease-out hover:-translate-y-2 hover:shadow-lg"
        >
          <span className="inline-grid size-12 place-items-center rounded-full bg-accent font-display text-lg font-light text-accent-on shadow-sm transition-transform duration-moderate ease-spring group-hover:-rotate-6 group-hover:scale-110">
            01
          </span>
          <h2 className="text-h4 text-content">{passo1.title}</h2>
          <p className="text-body-sm text-content-muted leading-relaxed">{passo1.text}</p>
          <div className="mt-auto flex flex-col gap-3 pt-2">
            <Button
              as="a"
              href={urls.android}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              fullWidth
              className={caps}
              leftIcon={<GooglePlayIcon className="size-4" />}
            >
              {labels.android}
            </Button>
            <Button
              as="a"
              href={urls.ios}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              fullWidth
              className={caps}
              leftIcon={<AppleIcon className="size-4" />}
            >
              {labels.ios}
            </Button>
          </div>
        </Reveal>

        {/* Passo 2 · Primeiros Passos */}
        <Reveal
          delay={150}
          className="group flex flex-col gap-5 rounded-2xl border border-subtle bg-surface p-8 shadow-sm transition-[transform,box-shadow] duration-moderate ease-out hover:-translate-y-2 hover:shadow-lg"
        >
          <span className="inline-grid size-12 place-items-center rounded-full bg-accent font-display text-lg font-light text-accent-on shadow-sm transition-transform duration-moderate ease-spring group-hover:-rotate-6 group-hover:scale-110">
            02
          </span>
          <h2 className="text-h4 text-content">{passo2.title}</h2>
          <p className="text-body-sm text-content-muted leading-relaxed">
            {passo2.textBefore}
            <strong className="font-medium text-accent-text">{passo2.highlight}</strong>
            {passo2.textAfter}
          </p>
          <div className="mt-auto pt-2">
            <Button
              as="a"
              href={urls.primeirosPassos}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              className={`${caps} ${gradient}`}
              rightIcon={<ArrowRight className="size-5" strokeWidth={1.5} />}
            >
              {labels.primeirosPassos}
            </Button>
          </div>
        </Reveal>
      </div>

      {/* Aviso opcional — ex.: Singular já treina com o Templo enquanto a ficha não chega. */}
      {aviso && (
        <Reveal
          delay={250}
          className="mx-auto mt-6 max-w-4xl rounded-2xl border border-accent/40 bg-accent-subtle p-6 text-center md:p-8"
        >
          <p className="text-body text-content-secondary leading-relaxed">
            {aviso.before}
            <strong className="font-medium text-accent-text">{aviso.highlight}</strong>
            {aviso.after}
          </p>
        </Reveal>
      )}

      {/* Assinatura da marca fechando a dobra dos passos. */}
      <Reveal variant="fade" duration={900} className="mt-16 text-center">
        <p className="font-display text-h1 font-light text-content md:text-display-sm">
          {fechamento.line1}
          <br className="md:hidden" />
          <span className="hidden md:inline">{' '}</span>
          {fechamento.line2}
        </p>
      </Reveal>
    </Section>
  )
}

/** Rodapé simples — só o logo e o copyright. */
function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface-inverse text-content-inverse">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-center md:flex-row md:text-left">
        <img src="/logo-anju.svg" alt="Anju Mace" className="h-3.5 w-auto" />
        <p className="text-caption text-content-inverse/60">
          © 2026 Anju Mace · Todos os direitos reservados
        </p>
      </div>
    </footer>
  )
}

/**
 * Template das páginas de obrigado (pós-compra) — confirmação + os dois
 * passos de onboarding (app do Circle e espaço no Circle). A copy de cada
 * plano vem por props: Templo (./data.js) e Singular (../obrigado-singular).
 */
export function ObrigadoTemplate({
  docTitle,
  hero,
  passos,
  labels,
  urls,
  aviso,
  fechamento,
  /* Fotos do hero — Templo por padrão; a página passa as suas se diferir. */
  bg = { desktop: '/bg1-desktop-obrigado.webp', mobile: '/bg1-mobile-obrigado.webp' },
}) {
  useEffect(() => {
    document.title = docTitle
  }, [docTitle])

  return (
    <div className="min-h-screen bg-surface-base text-content antialiased">
      <main>
        <ConfirmacaoHero hero={hero} bg={bg} />
        <PassosSection passos={passos} labels={labels} urls={urls} aviso={aviso} fechamento={fechamento} />
      </main>
      <Footer />
    </div>
  )
}
