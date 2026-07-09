import { useEffect } from 'react'
import { Nav } from './sections/Nav'
import { HeroSection } from './sections/HeroSection'
import { MarqueeBand } from './sections/MarqueeBand'
import { SingularidadeSection } from './sections/SingularidadeSection'
import { ProblemaSection } from './sections/ProblemaSection'
import { NiveisSection } from './sections/NiveisSection'
import { MecanismoSection } from './sections/MecanismoSection'
import { TemploSection } from './sections/TemploSection'
import { CursosSection } from './sections/CursosSection'
import { EntregaveisSection } from './sections/EntregaveisSection'
import { CredibilidadeSection } from './sections/CredibilidadeSection'
import { FechamentoSection } from './sections/FechamentoSection'
import { FooterSection } from '../sections/FooterSection'

/**
 * Landing "Plano Templo Singular" — consultoria de treino individualizada.
 * Copy em ./data.js. Renderizada com o design system Anju Mace.
 */
export function AppTemploSingular() {
  useEffect(() => {
    document.title = 'Anju Mace · Plano Templo Singular'
  }, [])

  return (
    <div className="min-h-screen bg-surface-base text-content antialiased">
      <Nav />
      <main>
        <HeroSection />
        <MarqueeBand />
        <SingularidadeSection />
        <ProblemaSection />
        <NiveisSection />
        <MecanismoSection />
        <TemploSection />
        <CursosSection />
        <EntregaveisSection />
        <CredibilidadeSection />
        <FechamentoSection />
      </main>
      <FooterSection />
    </div>
  )
}
