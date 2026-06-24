import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes condicionais (clsx) e resolve conflitos de utilitários
 * Tailwind (tailwind-merge). Use em todo componente do design system.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
