import { Reveal } from '../singular/Reveal'

/* Apresentação dos entregáveis do funil do guia — lista com ícone e
   descrição curta, seguida de um carrossel horizontal com uma imagem por
   item. Substitui os antigos cards "ícone + descrição + imagem" empilhados
   em grid (DeliverableCard/IncludeCard/OpenCard) pelo modelo da página
   anterior (WordPress): lista primeiro, depois navegação de imagens estilo
   Netflix — pedido explícito da CEO (23/07), que achava o grid "mais pobre"
   visualmente. Usado nas 3 páginas do funil do guia (/guia/download,
   /guia/obrigado, /guia/templo) pra manter a mesma linguagem visual. */

/** Item da lista — filete no topo, ícone num crachá quadrado, título,
    descrição, empilhados. Empilha em coluna única no mobile e vira grid de
    até 4 colunas no desktop (ver EntregaveisList) — pedido do usuário
    (23/07), referência era o checklist da página anterior (WP). tone adapta
    a cor do texto ao fundo da seção que a envolve (clara ou escura).
    O fundo do hover é uma camada `absolute -inset-5` (não margem negativa
    real) — a versão anterior usava -m-5/p-5, que mexia na caixa real do
    item e confundia o cálculo de altura da linha do grid pra itens com
    descrição mais longa (filete/crachá esmagados, última linha do texto
    vazando pra fora do fundo do hover). Elemento posicionado sai do fluxo
    normal e não afeta esse cálculo — pedido do usuário (23/07). */
function EntregavelItem({ icon: Icon, title, tone, children }) {
  const light = tone === 'light'
  return (
    <div className="group relative flex h-full flex-col gap-5">
      <span aria-hidden className="absolute -inset-5 -z-10 rounded-2xl transition-colors duration-moderate group-hover:bg-sage-500/10" />
      <span aria-hidden className="h-1 w-full shrink-0 rounded-full bg-sage-400" />
      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl border ${light ? 'border-graphite-900/15 text-graphite-900' : 'border-cream-100/20 text-cream-100'}`}>
        <Icon className="size-6" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h3 className={`font-display text-[22px] font-medium leading-snug tracking-tight ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{title}</h3>
        <p className={`text-[16px] leading-relaxed tracking-tight lg:text-[18px] ${light ? 'text-graphite-900/70' : 'text-cream-100/70'}`}>{children}</p>
      </div>
    </div>
  )
}

export function EntregaveisList({ items, tone = 'light' }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <Reveal key={item.title} delay={i * 40} className="h-full">
          <EntregavelItem icon={item.icon} title={item.title} tone={tone}>
            {item.description}
          </EntregavelItem>
        </Reveal>
      ))}
    </div>
  )
}

/** Carrossel horizontal — auto-loop contínuo (mesma linguagem da MarqueeBand
    já usada no fechamento dessas páginas), pedido do usuário (23/07): a
    fileira de módulos fica passando sozinha, sem depender de scroll manual.
    Itens duplicados (2x) pra loop perfeito com o keyframe `marquee`
    (translateX(-50%) = larga exatamente uma cópia); só pausa com o botão do
    mouse pressionado (clicar e arrastar) — passar o mouse por cima não para
    (pedido do usuário, 23/07). A fileira escapa do container em qualquer
    tela (w-screen + left-1/2/-translate) e cobre de ponta a ponta, sem
    gutter — inclusive no mobile (23/07), onde antes só o desktop escapava
    e sobrava uma margem à esquerda do primeiro cartão.
    item.richCover: true pras capas desenhadas pela CEO (23/07) — já vêm com
    título e composição prontos, então pulam o gradiente + legenda que a
    gente desenha por cima das fotos simples (senão duplicava o texto).
    will-change-transform na fileira + translateZ(0) em cada cartão força
    cada um pra sua própria camada composta — sem isso, o clip arredondado
    (rounded-2xl + overflow-hidden) de um card em movimento contínuo deixava
    uma friagem/faixa escura sub-pixel na borda em alguns navegadores,
    visível principalmente nos cantos (24/07). */
export function EntregaveisCarousel({ items }) {
  const track = [...items, ...items]
  return (
    <Reveal>
      <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <div className="flex w-max animate-[marquee_45s_linear_infinite] gap-4 pb-2 will-change-transform active:[animation-play-state:paused]">
          {track.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              aria-hidden={i >= items.length || undefined}
              className="group relative aspect-[2/3] w-[68vw] shrink-0 overflow-hidden rounded-2xl bg-graphite-900 [transform:translateZ(0)] sm:w-[280px] md:w-[340px] lg:w-[380px]"
            >
              <img
                src={item.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
              />
              {!item.richCover && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/95 via-graphite-950/10 to-transparent" aria-hidden />
                  <p className="absolute inset-x-0 bottom-0 p-5 text-h5 font-medium uppercase leading-tight tracking-tight text-cream-100">
                    {item.title}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
