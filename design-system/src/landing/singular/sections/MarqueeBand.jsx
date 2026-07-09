/**
 * Faixa marquee — quebra o ritmo entre o hero e o primeiro bloco editorial.
 * Frases-síntese da oferta rolando em loop contínuo (duplicadas para o loop
 * do keyframe `marquee`, que desloca -50%).
 */
const PHRASES = [
  'Prescrição Singular',
  'Lido no seu corpo',
  'Relido a cada ciclo',
  'Método T.E.M.P.L.O.',
  'Assinado por Anju Mace',
]

function Track({ hidden = false }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {PHRASES.map((phrase) => (
        <span key={phrase} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-display text-lg font-light tracking-wide text-cream-100/70">
            {phrase}
          </span>
          <span className="size-1.5 shrink-0 rounded-full bg-accent-2/70" aria-hidden />
        </span>
      ))}
    </div>
  )
}

export function MarqueeBand() {
  return (
    <div className="overflow-hidden border-y border-white/5 bg-graphite-950 py-6">
      <div className="flex w-max animate-marquee">
        <Track />
        <Track hidden />
      </div>
    </div>
  )
}
