import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — combina classes condicionais (clsx) e resolve conflitos do Tailwind
 * (tailwind-merge). Use em todo componente para mesclar `className` externo
 * com as classes internas sem duplicar/conflitar.
 *
 * @example cn('px-4 py-2', isActive && 'bg-accent', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
