import { KeyRound } from 'lucide-react'
import { ClientAccess } from './ClientAccess'
import { CardIcon } from '@/components/ui'
import { usePermissions } from '@/lib/permissions'
import { ANJU_ID } from '@/lib/tenant'

/** Acessos — credenciais e bancos de mídia das plataformas da Anju Mace. */
export function AccessPage() {
  const { can } = usePermissions()
  const isManager = can('manage_resources')
  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <div className="mb-6 flex items-start gap-3">
        <CardIcon tone="sage" className="mt-0.5"><KeyRound size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
        <div>
          <span className="font-mono text-mono-label uppercase text-steel-400">Ecossistema</span>
          <h1 className="mt-1 font-display text-h1 font-semibold text-strong">Acessos</h1>
          <p className="mt-1 text-body-s text-muted">
            Credenciais, verificação em duas etapas e custos das ferramentas — a planilha de acessos, viva e em um só lugar.
          </p>
        </div>
      </div>
      <ClientAccess clientId={ANJU_ID} canManage={isManager} />
    </div>
  )
}
