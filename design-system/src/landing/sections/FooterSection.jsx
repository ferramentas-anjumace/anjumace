import { MessageCircle, Mail } from 'lucide-react'
import { Wordmark } from '../../components'
import { FOOTER } from '../data'

/** Rodapé — marca, contato, navegação e legal. */
export function FooterSection() {
  return (
    <footer id="contato" className="bg-surface-inverse text-content-inverse">
      <div className="container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        {/* Marca + tagline */}
        <div className="flex flex-col gap-5">
          <Wordmark size="lg" tone="inverse" />
          <p className="max-w-sm text-body-sm text-content-inverse/70 leading-relaxed">
            {FOOTER.tagline}
          </p>
        </div>

        {/* Navegação */}
        <nav className="flex flex-col gap-3" aria-label="Rodapé">
          <span className="text-label text-content-inverse/50">Navegação</span>
          {FOOTER.nav.map((l) => (
            <a key={l} href="#inicio" className="text-body-sm text-content-inverse/80 hover:text-white">
              {l}
            </a>
          ))}
        </nav>

        {/* Contato */}
        <div className="flex flex-col gap-3">
          <span className="text-label text-content-inverse/50">Contato</span>
          <a href="#" className="inline-flex items-center gap-2 text-body-sm text-content-inverse/80 hover:text-white">
            <MessageCircle className="size-4" strokeWidth={1.5} /> {FOOTER.whatsapp}
          </a>
          <a
            href={`mailto:${FOOTER.email}`}
            className="inline-flex items-center gap-2 text-body-sm text-content-inverse/80 hover:text-white"
          >
            <Mail className="size-4" strokeWidth={1.5} /> {FOOTER.email}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-center md:flex-row md:text-left">
          <p className="text-caption text-content-inverse/60">{FOOTER.copyright}</p>
          <div className="flex gap-6">
            {FOOTER.legal.map((l) => (
              <a key={l} href="#" className="text-caption text-content-inverse/60 hover:text-white">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
