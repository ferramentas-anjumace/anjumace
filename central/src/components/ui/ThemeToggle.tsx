import { Moon, Sun, Check, Palette } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BRANDS, useTheme, type Brand } from '@/lib/theme'
import { IconButton } from './IconButton'
import { DropdownMenu, MenuItem, MenuLabel } from './DropdownMenu'

/**
 * ThemeToggle — alterna entre tema claro e escuro. Substitui o
 * ThemeTogglePlaceholder por uma alternância real conectada ao ThemeProvider.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <IconButton
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      onClick={toggleTheme}
      className={cn('size-9', className)}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon size={18} strokeWidth={1.5} aria-hidden />
      )}
    </IconButton>
  )
}

/**
 * BrandSwitcher — troca a marca white-label (sobrescreve só o accent). Demonstra
 * a camada temável: o chrome permanece, o accent muda por cliente.
 */
export function BrandSwitcher({ className }: { className?: string }) {
  const { brand, setBrand } = useTheme()
  return (
    <DropdownMenu
      align="end"
      className={className}
      trigger={
        <IconButton aria-label="Trocar marca" title="Marca (white-label)" className="size-9">
          <Palette size={18} strokeWidth={1.5} aria-hidden />
        </IconButton>
      }
    >
      <MenuLabel>Marca</MenuLabel>
      {BRANDS.map((b) => (
        <MenuItem
          key={b.value}
          onClick={() => setBrand(b.value as Brand)}
          icon={
            <span className="grid size-4 place-items-center">
              {brand === b.value && <Check size={14} strokeWidth={2} aria-hidden />}
            </span>
          }
        >
          {b.label}
        </MenuItem>
      ))}
    </DropdownMenu>
  )
}
