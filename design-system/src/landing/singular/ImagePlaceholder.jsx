import { Image as ImageIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * ImagePlaceholder — marcador visual de "foto entra aqui" durante a produção
 * da landing. Mostra o que subir e em que tamanho. Substituir por <img> real
 * quando os arquivos existirem (mesma proporção do `ratio`).
 *
 * - label: o que a foto deve mostrar
 * - size: dimensão recomendada (ex. "1080 × 1350 px · 4:5 · WebP")
 * - ratio: classe aspect-* que reserva a proporção real
 * - tone: light (blocos claros) | dark (blocos grafite/sálvia)
 */
export function ImagePlaceholder({
  label,
  size,
  ratio = 'aspect-[4/5]',
  tone = 'light',
  rounded = 'rounded-3xl',
  className,
}) {
  const dark = tone === 'dark'
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 overflow-hidden border-2 border-dashed p-6 text-center',
        ratio,
        rounded,
        dark
          ? 'border-white/25 bg-white/5 text-white/60'
          : 'border-accent/40 bg-accent-subtle/40 text-accent-text',
        className,
      )}
    >
      <ImageIcon className="size-8 opacity-70" strokeWidth={1.25} aria-hidden />
      <p className="max-w-[24ch] text-body-sm font-medium leading-snug">{label}</p>
      {size && <p className="font-mono text-xs tracking-wide opacity-70">{size}</p>}
    </div>
  )
}
