import { ClientContent } from './ClientContent'
import { usePermissions } from '@/lib/permissions'
import { ANJU_ID } from '@/lib/tenant'

/** Conteúdo — biblioteca de materiais e produção da Anju Mace. */
export function ContentPage() {
  const { can } = usePermissions()
  const isManager = can('manage_resources')
  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <div className="mb-6">
        <span className="font-mono text-mono-label uppercase text-steel-400">Ecossistema</span>
        <h1 className="mt-1 font-display text-h1 font-semibold text-strong">Conteúdo</h1>
        <p className="mt-1 text-body-s text-muted">
          Bancos de mídia, identidade visual e a biblioteca de materiais de produção.
        </p>
      </div>
      <ClientContent clientId={ANJU_ID} canManage={isManager} />
    </div>
  )
}
