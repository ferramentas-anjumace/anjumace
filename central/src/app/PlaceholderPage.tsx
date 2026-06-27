import { Construction } from 'lucide-react'
import { SectionHeader, EmptyState, Button } from '@/components/ui'

/** Página genérica "em construção" para rotas ainda não implementadas. */
export function PlaceholderPage({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <SectionHeader eyebrow={eyebrow} title={title} className="mb-8" />
      <EmptyState
        icon={<Construction size={22} strokeWidth={1.5} />}
        title="Em construção"
        description="Esta área ainda não faz parte do escopo do design system. As telas de Visão geral, Usuários e detalhe estão completas."
        action={<Button variant="secondary">Solicitar acesso antecipado</Button>}
      />
    </div>
  )
}
