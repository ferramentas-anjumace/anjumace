import { useEffect, useRef } from 'react'

/** Bloqueia o scroll do body enquanto `active` for verdadeiro. */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [active])
}

/** Chama `onEscape` quando Escape é pressionado (enquanto `active`). */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [active, onEscape])
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Aprisiona o foco dentro do container enquanto `active`, devolvendo o foco
 * ao elemento anterior ao fechar. Foca o primeiro elemento focável na abertura.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active || !ref.current) return
    const container = ref.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )

    // foco inicial
    const first = focusables()[0]
    first?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    container.addEventListener('keydown', handler)
    return () => {
      container.removeEventListener('keydown', handler)
      previouslyFocused?.focus?.()
    }
  }, [active])

  return ref
}
