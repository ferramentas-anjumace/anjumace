import { Play, ArrowRight, Target, Sparkles, HeartPulse } from 'lucide-react'
import {
  Button, Badge, Divider,
  Section, SectionHeader, Highlight,
  Card, CardTitle, CardDescription,
  Feature, FeatureGrid, Stat, StatGroup,
  SocialProof, Testimonial, MediaPlayer, Chip,
  FAQ, PricingCard, PricingTable, CTABlock, Hero, LeadCapture,
} from '../../components'
import { ShowcaseSection } from '../ui'

const PEOPLE = [
  { name: 'Bia Lima' }, { name: 'Ana Reis' }, { name: 'Duda Sá' }, { name: 'Lia Couto' },
]

const FAQ_ITEMS = [
  { question: 'Como funciona a consultoria personalizada?', answer: 'Começa com uma análise técnica do seu perfil — histórico, objetivos e contexto de vida — e gera um protocolo único, com ajustes contínuos e acompanhamento.', icon: <Target className="size-6" strokeWidth={1.2} /> },
  { question: 'Preciso ter experiência prévia?', answer: 'Não. A metodologia atende desde quem nunca treinou até atletas buscando refinamento técnico. Cada protocolo é calibrado para o seu nível atual.', icon: <Sparkles className="size-6" strokeWidth={1.2} /> },
  { question: 'Quanto tempo leva para ver resultados?', answer: 'Mudanças na qualidade do movimento e energia aparecem nas primeiras semanas; resultados físicos mensuráveis entre 8 e 12 semanas de aplicação consistente.', icon: <HeartPulse className="size-6" strokeWidth={1.2} /> },
]

export function MarketingSection() {
  return (
    <div className="space-y-20">
      {/* HERO imersivo */}
      <ShowcaseSection id="hero" title="Hero">
        <div className="-mx-6 md:mx-0 md:rounded-3xl md:overflow-hidden border border-subtle">
          <Hero
            image="https://picsum.photos/id/1011/1600/900?grayscale"
            eyebrow="Método Anju Mace"
            title={<>A transformação que você merece começa aqui.</>}
            description="Consultoria de treino com rigor científico, execução elegante e propósito consciente — para mulheres que querem evolução duradoura."
            minH="min-h-[560px]"
            actions={
              <>
                <Button size="lg">Avaliação exclusiva</Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" leftIcon={<Play className="size-4 fill-white" strokeWidth={1} />}>
                  Assistir ao vídeo
                </Button>
              </>
            }
            aside={<SocialProof variant="glass" people={PEOPLE} rating={5} label="+2.000 alunas transformadas" />}
          />
        </div>
      </ShowcaseSection>

      {/* SECTION + HEADER + FEATURES */}
      <ShowcaseSection id="section" title="Section · SectionHeader · Feature">
        <Section tone="surface" padding="sm" className="rounded-3xl border border-subtle">
          <SectionHeader
            eyebrow="Who we are"
            title={<>Pioneiras em <Highlight>transformação consciente</Highlight></>}
            description="Uma abordagem que redefine o treino feminino, unindo ciência e sensibilidade."
          />
          <FeatureGrid className="mt-12" columns={3}>
            <Feature icon={<Target className="size-7" strokeWidth={1.2} />} title="Análise técnica profunda" description="Avaliação minuciosa do seu perfil biomecânico e objetivos." />
            <Feature icon={<Sparkles className="size-7" strokeWidth={1.2} />} title="Elegância na execução" description="Protocolos que respeitam sua singularidade e ritmo." />
            <Feature icon={<HeartPulse className="size-7" strokeWidth={1.2} />} title="Resultados duradouros" description="Mudanças que se integram à sua vida — não efeitos passageiros." />
          </FeatureGrid>
        </Section>
      </ShowcaseSection>

      {/* MEDIA + STATS */}
      <ShowcaseSection id="media" title="MediaPlayer · Stat">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <MediaPlayer image="https://picsum.photos/id/1027/800/450?grayscale" chip={<Chip glass>12:30</Chip>} />
          <StatGroup className="md:grid-cols-2">
            <Stat value="+2k" label="Alunas ativas" />
            <Stat value="98%" label="Taxa de adesão" />
            <Stat value="4.9" label="Avaliação média" />
            <Stat value="12wk" label="Resultados visíveis" />
          </StatGroup>
        </div>
      </ShowcaseSection>

      {/* CARDS + TESTIMONIAL */}
      <ShowcaseSection id="cards" title="Card · Testimonial">
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="elevated">
            <Badge variant="accent" size="sm" className="mb-3">Treino</Badge>
            <CardTitle>Força &amp; mobilidade</CardTitle>
            <CardDescription className="mt-1">Ativação completa com estímulo metabólico.</CardDescription>
          </Card>
          <Card variant="surface" interactive as="button" className="text-left">
            <CardTitle>Card interativo</CardTitle>
            <CardDescription className="mt-1">Hover eleva sutilmente. Clique-me.</CardDescription>
          </Card>
          <Testimonial
            quote="Mudou completamente minha relação com o treino. Resultados que permanecem."
            author="Marina Alves"
            role="Aluna há 8 meses"
            rating={5}
          />
        </div>
      </ShowcaseSection>

      {/* PRICING */}
      <ShowcaseSection id="pricing" title="Pricing">
        <PricingTable>
          <PricingCard name="Essencial" price="R$97" description="Para começar com método." features={['Plano de treino mensal', 'Biblioteca de execução', 'Suporte por chat']} cta={{ label: 'Assinar' }} />
          <PricingCard name="Consultoria" price="R$297" featured badge="Mais popular" description="Acompanhamento técnico completo." features={['Tudo do Essencial', 'Protocolo personalizado', 'Check-ins quinzenais', 'Ajustes contínuos']} cta={{ label: 'Quero esse' }} />
          <PricingCard name="Premium" price="R$597" description="Evolução de alta performance." features={['Tudo da Consultoria', 'Sessões 1:1 semanais', 'Análise de vídeo', 'Acesso prioritário']} cta={{ label: 'Falar com time' }} />
        </PricingTable>
      </ShowcaseSection>

      {/* FAQ */}
      <ShowcaseSection id="faq" title="FAQ (accordion timeline)">
        <div className="max-w-3xl">
          <FAQ items={FAQ_ITEMS} />
        </div>
      </ShowcaseSection>

      {/* LEAD CAPTURE + CTA */}
      <ShowcaseSection id="cta" title="LeadCapture · CTABlock">
        <LeadCapture
          title="Receba o checklist matinal gratuito"
          description="Pequenos hábitos que preparam corpo e mente para treinar melhor."
          ctaLabel="Quero o checklist"
          note="Sem spam. Você pode sair quando quiser."
        />
        <CTABlock
          eyebrow="Vagas limitadas"
          title="Sua evolução começa com uma decisão."
          description="Garanta sua avaliação exclusiva e dê o primeiro passo."
          actions={<Button size="lg" rightIcon={<ArrowRight className="size-4" strokeWidth={1.5} />}>Avaliação exclusiva</Button>}
        />
      </ShowcaseSection>
    </div>
  )
}
