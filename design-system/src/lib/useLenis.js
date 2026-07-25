import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Smooth-scroll de página inteira (inércia), igual ao site WordPress original.
 * Desliga sozinho para quem prefere `prefers-reduced-motion`.
 */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })

    let frame
    function raf(time) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])
}
