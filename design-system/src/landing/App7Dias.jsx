import { Nav } from './sections/Nav'
import { HeroSection } from './sections/HeroSection'
import { VideoSection } from './sections/VideoSection'
import { ManifestoSection } from './sections/ManifestoSection'
import { ModulesSection } from './sections/ModulesSection'
import { EcosystemSection } from './sections/EcosystemSection'
import { JourneySection } from './sections/JourneySection'
import { SeriesSection } from './sections/SeriesSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { PricingSection } from './sections/PricingSection'
import { GuaranteeSection } from './sections/GuaranteeSection'
import { FaqSection } from './sections/FaqSection'
import { FooterSection } from './sections/FooterSection'

/**
 * Landing "App 7 dias" — Anju Mace.
 * Reconstruída a partir da página WordPress, renderizada com o design system.
 */
export function App7Dias() {
  return (
    <div className="min-h-screen bg-surface-base text-content antialiased">
      <Nav />
      <main>
        <HeroSection />
        <VideoSection />
        <ManifestoSection />
        <ModulesSection />
        <EcosystemSection />
        <JourneySection />
        <SeriesSection />
        <TestimonialsSection />
        <PricingSection />
        <GuaranteeSection />
        <FaqSection />
      </main>
      <FooterSection />
    </div>
  )
}
