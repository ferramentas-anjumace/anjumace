import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/* ----------------------------------------------------------------------------
   Theming + white-label
   ----------------------------------------------------------------------------
   Estado de tema (claro/escuro) e marca (white-label). Aplica os atributos
   data-theme / data-brand no <html> e persiste em localStorage. O chrome troca
   por tema; só o accent troca por marca. Ver src/styles/tokens.css.
---------------------------------------------------------------------------- */

export type Theme = 'dark' | 'light'
export type Brand = 'default' | 'gold'

/** Marcas disponíveis (para seletores de UI). */
export const BRANDS: { value: Brand; label: string }[] = [
  { value: 'default', label: 'Anju · Sálvia' },
  { value: 'gold', label: 'Anju · Dourado' },
]

const THEME_KEY = 'anju-theme'
const BRAND_KEY = 'anju-brand'

/**
 * Tema travado no claro por decisão de produto (2026-07). O dark mode continua
 * implementado — para reativar a alternância, basta voltar isto para `false`
 * (e restaurar o script pré-paint no index.html).
 */
export const THEME_LOCKED = true

/** Marca travada na Sálvia (default). Voltar para `false` reativa o seletor. */
export const BRAND_LOCKED = true

interface ThemeCtx {
  theme: Theme
  brand: Brand
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setBrand: (b: Brand) => void
}

const Context = createContext<ThemeCtx | null>(null)

function readTheme(): Theme {
  if (THEME_LOCKED) return 'light'
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readBrand(): Brand {
  if (BRAND_LOCKED) return 'default'
  if (typeof window === 'undefined') return 'default'
  return (localStorage.getItem(BRAND_KEY) as Brand) || 'default'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [brand, setBrandState] = useState<Brand>(readBrand)

  // Sincroniza <html> + persiste sempre que algo muda.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // Mantém a classe `dark` coerente para utilitários `dark:` do Tailwind.
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    if (brand === 'default') root.removeAttribute('data-brand')
    else root.setAttribute('data-brand', brand)
    localStorage.setItem(BRAND_KEY, brand)
  }, [brand])

  const setTheme = useCallback((t: Theme) => {
    if (THEME_LOCKED) return
    setThemeState(t)
  }, [])
  const toggleTheme = useCallback(
    () => {
      if (THEME_LOCKED) return
      setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
    },
    [],
  )
  const setBrand = useCallback((b: Brand) => {
    if (BRAND_LOCKED) return
    setBrandState(b)
  }, [])

  const value = useMemo<ThemeCtx>(
    () => ({ theme, brand, setTheme, toggleTheme, setBrand }),
    [theme, brand, setTheme, toggleTheme, setBrand],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTheme() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
