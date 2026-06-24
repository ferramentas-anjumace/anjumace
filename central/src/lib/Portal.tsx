import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/** Renderiza children em um nó no fim do <body> (para overlays). */
export function Portal({ children }: { children: React.ReactNode }) {
  const [el] = useState(() => {
    const node = document.createElement('div')
    node.setAttribute('data-upskl-portal', '')
    return node
  })

  useEffect(() => {
    document.body.appendChild(el)
    return () => {
      document.body.removeChild(el)
    }
  }, [el])

  return createPortal(children, el)
}
