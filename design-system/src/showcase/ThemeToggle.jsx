import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '../lib/cn'

/** Alterna data-theme no <html> e persiste a escolha. */
export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('am-theme') || 'light',
  )
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('am-theme', theme)
  }, [theme])
  return { theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }
}

export function ThemeToggle({ theme, onToggle, className }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
      className={cn(
        'inline-flex items-center gap-2 h-11 rounded-full border border-strong px-5',
        'text-body-sm font-medium text-content bg-surface',
        'transition-colors duration-fast ease-standard hover:bg-surface-sunken',
        'focus-visible:shadow-focus focus-visible:outline-none',
        className,
      )}
    >
      {theme === 'light' ? <Moon className="size-4" strokeWidth={1.5} /> : <Sun className="size-4" strokeWidth={1.5} />}
      {theme === 'light' ? 'Escuro' : 'Claro'}
    </button>
  )
}
