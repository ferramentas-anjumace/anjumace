import { EditorialCalendar } from './EditorialCalendar'
import { usePermissions } from '@/lib/permissions'
import { ANJU_ID } from '@/lib/tenant'

/** Editorial — calendário de criativos e fluxo de produção da Anju Mace. */
export function EditorialPage() {
  const { can } = usePermissions()
  const isManager = can('manage_resources')
  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <div className="mb-6">
        <span className="font-mono text-mono-label uppercase text-steel-400">Editorial</span>
        <h1 className="mt-1 font-display text-h1 font-semibold text-strong">Calendário de Conteúdos</h1>
        <p className="mt-1 text-body-s text-muted">
          Calendário de criativos: formato, canais, etapa de produção e aprovação.
        </p>
      </div>
      <EditorialCalendar clientId={ANJU_ID} canManage={isManager} />
    </div>
  )
}
