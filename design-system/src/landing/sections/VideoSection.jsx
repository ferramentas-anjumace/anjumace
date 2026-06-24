import { ArrowRight } from 'lucide-react'
import { Section, MediaPlayer, Button } from '../../components'
import { VIDEO } from '../data'

/** Bloco de vídeo: headline + player de vidro + CTA. */
export function VideoSection() {
  return (
    <Section tone="warm" padding="lg">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
        <span className="text-label text-accent-text">{VIDEO.caption}</span>
        <h2 className="text-h2 text-content">{VIDEO.title}</h2>
      </div>

      <div className="mx-auto mt-10 max-w-4xl">
        <MediaPlayer image={VIDEO.poster} alt="Apresentação Anju Mace" ratio="video" />
      </div>

      <div className="mt-10 flex justify-center">
        <Button as="a" href="#planos" size="lg" rightIcon={<ArrowRight className="size-5" strokeWidth={1.5} />}>
          {VIDEO.cta}
        </Button>
      </div>
    </Section>
  )
}
