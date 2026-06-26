import { ClientAccess } from './ClientAccess'
import { usePermissions } from '@/lib/permissions'
import { ANJU_ID } from '@/lib/tenant'

/** Acessos — credenciais e bancos de mídia das plataformas da Anju Mace. */
export function AccessPage() {
  const { can } = usePermissions()
  const isManager = can('manage_resources')
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <span className="font-mono text-mono-label uppercase text-steel-400">Ecossistema</span>
        <h1 className="mt-1 font-display text-h1 font-semibold text-strong">Acessos</h1>
        <p className="mt-1 text-body-s text-muted">
          Credenciais das plataformas e bancos de mídia. Abra, copie e gerencie em um só lugar.
        </p>
      </div>
      <ClientAccess clientId={ANJU_ID} canManage={isManager} />
    </div>
  )
}
