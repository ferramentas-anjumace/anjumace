import { Section, Testimonial } from '../../components'
import { Reveal } from '../singular/Reveal'
import { TESTIMONIALS } from '../data'

/** Depoimentos — "Musas despertas". (itens placeholder até depoimentos reais) */
export function TestimonialsSection() {
  return (
    <Section tone="warm" padding="lg">
      <Reveal className="mx-auto mb-12 max-w-3xl text-center">
        <span className="text-label text-accent-text">{TESTIMONIALS.title}</span>
        <h2 className="mt-4 text-h2 text-content">{TESTIMONIALS.lead}</h2>
        <p className="mt-4 text-body-lg text-content-secondary">{TESTIMONIALS.description}</p>
      </Reveal>

      {/* Fileira de avatares da comunidade */}
      <Reveal delay={80} variant="scale" className="mb-10 flex justify-center">
        <img
          src="/landing/Frame-1707480643-1.webp"
          alt="Comunidade Anju Mace"
          className="h-12 w-auto"
        />
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.items.map((t, i) => (
          <Reveal key={i} delay={i * 100}>
            <Testimonial quote={t.quote} author={t.author} role={t.role} rating={5} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
