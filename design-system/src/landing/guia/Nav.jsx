import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'

/* Barra de navegação das 3 páginas do funil do guia (/guia/download,
   /guia/obrigado, /guia/templo) — recriação da nav da landing principal
   (src/landing/sections/Nav.jsx), pedido do usuário (23/07). Cada página
   passa os próprios links (âncoras pro conteúdo real dela, que difere de
   página pra página) e o próprio CTA/checkout — não há um NAV_LINKS único
   pro funil inteiro, ao contrário da landing principal.
   absolute (não fixed): renderizada DENTRO da seção do hero (dobra 1), não
   como sticky/fixed no topo da página — some ao rolar pra fora do hero,
   em vez de acompanhar o scroll (pedido do usuário, 23/07).
   Wrapper próprio (não .container): com links maiores (23/07) e o texto do
   CTA mais longo em /guia/obrigado, o teto de 1050px do .container (regra
   .page-largura-1050) espremia os links e quebrava linha. A nav usa um teto
   mais largo, só pra ela, com o mesmo padding responsivo do .container.
   Mobile (abaixo do lg): logo vira a marca empilhada (ANJU MACE LOGO 2.svg,
   asset da CEO) + botão hamburguer que abre os links e o CTA num painel —
   antes disso o menu mobile não tinha NENHUMA forma de acessar os links ou
   o CTA, só a logo aparecia. Pedido do usuário (23/07). */

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

export function Nav({ links, ctaLabel, ctaHref }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 pb-4 pt-10 md:px-10 lg:px-16 xl:px-20">
        <a href="#inicio" className="shrink-0" aria-label="Anju Mace — início" onClick={() => setOpen(false)}>
          <img src="/logo-anju-stacked.svg" alt="Anju Mace" className="h-10 w-auto lg:hidden" />
          <img src="/logo-anju.svg" alt="Anju Mace" className="hidden h-4 w-auto lg:block" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-cream-100/70 transition-colors duration-fast hover:text-cream-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href={ctaHref}
          className={`group hidden shrink-0 items-center gap-3 whitespace-nowrap rounded-full py-2 pl-6 pr-2 text-sm font-medium uppercase tracking-wide md:inline-flex ${gradient}`}
        >
          {ctaLabel}
          <span className="inline-grid size-9 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
            <ArrowRight className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="inline-grid size-11 shrink-0 place-items-center rounded-full text-cream-100 transition-colors hover:bg-cream-100/10 lg:hidden"
        >
          {open ? <X className="size-6" strokeWidth={1.5} aria-hidden /> : <Menu className="size-6" strokeWidth={1.5} aria-hidden />}
        </button>
      </div>

      {open && (
        <div className="border-t border-cream-100/10 bg-graphite-950/95 backdrop-blur-sm lg:hidden">
          <nav className="mx-auto flex max-w-[1400px] flex-col gap-1 px-6 py-6 md:px-10" aria-label="Principal (mobile)">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-[18px] text-cream-100/80 transition-colors hover:bg-cream-100/5 hover:text-cream-100"
              >
                {l.label}
              </a>
            ))}
            <a
              href={ctaHref}
              onClick={() => setOpen(false)}
              className={`mt-3 flex items-center justify-center gap-3 rounded-full py-3 text-sm font-medium uppercase tracking-wide ${gradient}`}
            >
              {ctaLabel}
              <ArrowRight className="size-5" strokeWidth={1.5} aria-hidden />
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
