import { Building2 } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * ClientAvatar — mostra a foto do cliente (se houver) ou o ícone de prédio
 * como fallback. As classes de tamanho/raio vêm via `className`.
 */
export function ClientAvatar({
  src,
  name,
  className,
  iconSize = 18,
}: {
  src?: string
  name: string
  className?: string
  iconSize?: number
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden border border-line bg-slate-800',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <Building2 size={iconSize} strokeWidth={1.5} className="text-steel-300" aria-hidden />
      )}
    </span>
  )
}
