import { ShieldCheck, Lock } from 'lucide-react'
import {
  SectionHeader,
  CardIcon,
  Card,
  Switch,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  EmptyState,
  useToast,
} from '@/components/ui'
import { ROLE_LABEL, type Role } from '@/lib/session'
import { usePermissions, CAPABILITIES, type Capability } from '@/lib/permissions'

/* Papéis configuráveis na matriz (Admin é fixo em tudo e não aparece editável). */
const EDITABLE_ROLES: Role[] = ['lideranca', 'comercial', 'crm', 'social', 'design']
const COLUMNS: Role[] = ['design', 'comercial', 'crm', 'social', 'lideranca', 'admin']

export function PermissionsPage() {
  const toast = useToast()
  const { matrix, can, updateRole } = usePermissions()
  const canEdit = can('manage_users')

  const toggle = async (role: Role, cap: Capability, value: boolean) => {
    const { error } = await updateRole(role, { [cap]: value })
    if (error) toast.error('Falha ao salvar permissão', error)
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <SectionHeader
        eyebrow="Sistema"
        title="Funções & permissões"
        description="Controle o que cada papel pode fazer. O Administrador tem acesso total e não pode ser limitado."
        icon={<CardIcon tone="sage"><ShieldCheck size={18} strokeWidth={1.5} aria-hidden /></CardIcon>}
        className="mb-6"
      />

      {!canEdit && (
        <Card className="mb-4 border-warn/30 bg-warn-tint/30">
          <p className="flex items-center gap-2 text-body-s text-warn">
            <Lock size={16} strokeWidth={1.5} />
            Você pode ver a matriz, mas só quem tem “Gerir usuários” pode alterá-la.
          </p>
        </Card>
      )}

      <Card className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Ação</TableHeaderCell>
              {COLUMNS.map((r) => (
                <TableHeaderCell key={r} align="center" className="w-32">
                  <span className="inline-flex items-center gap-1.5">
                    {ROLE_LABEL[r]}
                    {r === 'admin' && <Badge tone="steel" size="sm">fixo</Badge>}
                  </span>
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {CAPABILITIES.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1}>
                  <EmptyState
                    className="border-0 bg-transparent py-6"
                    icon={<ShieldCheck size={22} strokeWidth={1.5} />}
                    title="Nenhuma ação configurável"
                  />
                </TableCell>
              </TableRow>
            ) : (
              CAPABILITIES.map((capDef) => (
                <TableRow key={capDef.key}>
                  <TableCell>
                    <div className="font-medium text-strong">{capDef.label}</div>
                    <div className="text-[12px] text-faint">{capDef.hint}</div>
                  </TableCell>
                  {COLUMNS.map((r) => {
                    const checked = r === 'admin' ? true : matrix[r]?.[capDef.key] ?? false
                    const locked = r === 'admin' || !canEdit || !EDITABLE_ROLES.includes(r)
                    return (
                      <TableCell key={r} align="center">
                        <div className="flex justify-center">
                          <Switch
                            checked={checked}
                            disabled={locked}
                            onChange={(e) => toggle(r, capDef.key, e.target.checked)}
                            aria-label={`${capDef.label} — ${ROLE_LABEL[r]}`}
                          />
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <p className="mt-3 text-[12px] text-faint">
        As mudanças valem na hora para novas ações e ao recarregar a página de quem já está logado.
        O bloqueio também é aplicado no banco (RLS), não só na interface.
      </p>
    </div>
  )
}
