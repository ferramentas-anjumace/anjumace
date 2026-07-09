import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * useInView — true quando o elemento entra no viewport (uma única vez).
 * Base das animações de scroll da landing.
 */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView]
}

const variants = {
  up: { from: 'opacity-0 translate-y-10', to: 'opacity-100 translate-y-0' },
  left: { from: 'opacity-0 -translate-x-10', to: 'opacity-100 translate-x-0' },
  right: { from: 'opacity-0 translate-x-10', to: 'opacity-100 translate-x-0' },
  fade: { from: 'opacity-0', to: 'opacity-100' },
  scale: { from: 'opacity-0 scale-95', to: 'opacity-100 scale-100' },
}

/**
 * Reveal — anima a entrada do conteúdo quando ele aparece no scroll.
 * Sempre opacity/transform (barato); `prefers-reduced-motion` é atendido
 * pelo reset global (durações viram 0.01ms).
 *
 * - variant: up | left | right | fade | scale — ou passe `from`/`to` custom
 * - delay: ms — use para stagger (ex.: i * 100)
 * - duration: ms (default 700, tom editorial de landing)
 */
export function Reveal({
  as: Comp = 'div',
  variant = 'up',
  from,
  to,
  delay = 0,
  duration = 700,
  className,
  children,
  ...props
}) {
  const [ref, inView] = useInView()
  const v = variants[variant] ?? variants.up

  return (
    <Comp
      ref={ref}
      className={cn(
        'transition-all ease-out will-change-[transform,opacity]',
        inView ? (to ?? v.to) : (from ?? v.from),
        className,
      )}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Comp>
  )
}
