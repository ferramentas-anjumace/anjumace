import { Section, PricingCard, Button } from '../../components'
import { PLANS, PLANS_INTRO } from '../data'

function PlanButton({ plan }) {
  return (
    <Button as="a" href="#contato" variant={plan.featured ? 'primary' : 'outline'} fullWidth>
      {plan.cta}
    </Button>
  )
}

/** Planos — intro + 5 níveis (3 em cima, 2 embaixo). */
export function PricingSection() {
  const top = PLANS.slice(0, 3)
  const bottom = PLANS.slice(3)

  return (
    <Section id="planos" tone="base" padding="lg">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <span className="text-label text-accent-text">Planos</span>
        <h2 className="mt-4 text-h2 text-content">{PLANS_INTRO.title}</h2>
        <p className="mt-4 text-body-lg text-content-secondary">{PLANS_INTRO.description}</p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {top.map((p) => (
          <PricingCard
            key={p.name}
            name={p.name}
            price={p.price}
            period={p.period}
            description={p.description}
            features={p.features}
            featured={p.featured}
            badge={p.badge}
            cta={<PlanButton plan={p} />}
          />
        ))}
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        {bottom.map((p) => (
          <PricingCard
            key={p.name}
            name={p.name}
            price={p.price}
            period={p.period}
            description={p.description}
            features={p.features}
            cta={<PlanButton plan={p} />}
          />
        ))}
      </div>
    </Section>
  )
}
