import { Section, FAQ } from '../../components'
import { FAQ_ITEMS } from '../data'

/** Perguntas frequentes. */
export function FaqSection() {
  return (
    <Section tone="surface" padding="lg">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="flex flex-col gap-4">
          <span className="text-label text-accent-text">FAQ</span>
          <h2 className="text-h2 text-content">Clareza para sua decisão</h2>
          <p className="text-body-lg text-content-secondary">
            A transparência é o primeiro pilar da nossa relação. Se restar incerteza, nossa equipe
            está pronta para orientá-la com precisão e acolhimento.
          </p>
        </div>
        <FAQ items={FAQ_ITEMS} />
      </div>
    </Section>
  )
}
