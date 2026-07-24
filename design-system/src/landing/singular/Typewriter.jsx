import { useEffect, useState } from 'react'
import { useInView } from './Reveal'

/** Efeito de máquina de escrever — revela o texto caractere a caractere
    quando entra na viewport (mesmo gatilho do Reveal, IntersectionObserver
    disparado uma vez). Só pra frases curtas e de impacto (headline/tagline
    de fechamento), não pra parágrafos longos — pedido do usuário (24/07):
    "máquina de escrever... em algumas partes", não em tudo.
    text aceita \n pra quebra de linha (renderiza com whitespace-pre-line).
    Cursor pisca enquanto digita, some ao terminar. O texto completo também
    fica num span sr-only — leitor de tela não depende da animação. */
export function Typewriter({ text, speed = 28, className = '', as: Comp = 'p' }) {
  const [ref, inView] = useInView({ threshold: 0.4 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView || count >= text.length) return
    const id = setTimeout(() => setCount((c) => c + 1), speed)
    return () => clearTimeout(id)
  }, [inView, count, text, speed])

  return (
    <Comp ref={ref} className={`whitespace-pre-line ${className}`}>
      <span aria-hidden="true">
        {text.slice(0, count)}
        <span
          className={`ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] bg-current align-middle transition-opacity ${count < text.length ? 'animate-pulse opacity-100' : 'opacity-0'}`}
        />
      </span>
      <span className="sr-only">{text}</span>
    </Comp>
  )
}
