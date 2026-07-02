import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { useSession, type Role } from './session'

/* ----------------------------------------------------------------------------
   Permissões por papel (tabela public.role_permissions)
   ----------------------------------------------------------------------------
   Matriz papel × capacidade que os gestores controlam. O app lê daqui para
   liberar/bloquear ações na UI; o RLS aplica as mesmas regras no banco
   (função public.can). Admin tem SEMPRE tudo.
---------------------------------------------------------------------------- */

export type Capability =
  | 'create_task' | 'move_task' | 'manage_users' | 'manage_resources'
  | 'manage_catalogs' | 'manage_crm' | 'manage_social'

export const CAPABILITIES: { key: Capability; label: string; hint: string }[] = [
  { key: 'create_task', label: 'Criar tarefas', hint: 'Subir novas demandas no quadro.' },
  { key: 'move_task', label: 'Mover/concluir tarefas', hint: 'Arrastar entre etapas e concluir.' },
  { key: 'manage_users', label: 'Gerir usuários', hint: 'Criar/excluir pessoas e trocar papéis.' },
  { key: 'manage_resources', label: 'Gerir acessos e agenda', hint: 'Credenciais e agenda.' },
  { key: 'manage_catalogs', label: 'Gerir catálogos', hint: 'Listas editáveis: categorias, formatos e dropdowns do CRM.' },
  { key: 'manage_crm', label: 'Gerir CRM comercial', hint: 'Ver e editar leads, pipeline e histórico do CRM.' },
  { key: 'manage_social', label: 'Gerir Social Media', hint: 'Editar o Calendário de Conteúdos e a área de métricas do Instagram.' },
]

export type RoleCaps = Record<Capability, boolean>
export type PermissionMatrix = Record<Role, RoleCaps>

const ALL_TRUE: RoleCaps = { create_task: true, move_task: true, manage_users: true, manage_resources: true, manage_catalogs: true, manage_crm: true, manage_social: true }

/** Fallback até carregar do banco (mesmos defaults da migration). */
const DEFAULT_MATRIX: PermissionMatrix = {
  admin: { ...ALL_TRUE },
  lideranca: { ...ALL_TRUE },
  // Comercial: executa tarefas como base, porém com acesso ao CRM (relação 1:1).
  comercial: { create_task: false, move_task: true, manage_users: false, manage_resources: false, manage_catalogs: false, manage_crm: true, manage_social: false },
  // CRM: mesmo acesso do Comercial (gerência da base / disparos). Só o rótulo muda.
  crm: { create_task: false, move_task: true, manage_users: false, manage_resources: false, manage_catalogs: false, manage_crm: true, manage_social: false },
  // Social Media: tarefas como base, gerindo o Editorial/Social e os catálogos.
  social: { create_task: false, move_task: true, manage_users: false, manage_resources: false, manage_catalogs: true, manage_crm: false, manage_social: true },
  // Design: base de menor privilégio (só mover tarefas). Ajustável na tela de Permissões.
  design: { create_task: false, move_task: true, manage_users: false, manage_resources: false, manage_catalogs: false, manage_crm: false, manage_social: false },
}

interface PermissionRow {
  role: Role
  create_task: boolean
  move_task: boolean
  manage_users: boolean
  manage_resources: boolean
  manage_catalogs: boolean
  manage_crm: boolean
  manage_social: boolean
}

interface PermissionsCtx {
  matrix: PermissionMatrix
  loading: boolean
  /** A pessoa logada tem a capacidade? (admin sempre true) */
  can: (cap: Capability) => boolean
  /** Atualiza as capacidades de um papel (só efetiva se quem chama puder). */
  updateRole: (role: Role, patch: Partial<RoleCaps>) => Promise<{ error: string | null }>
  refresh: () => Promise<void>
}

const Context = createContext<PermissionsCtx | null>(null)

const POLL_MS = 60_000

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { status, role } = useSession()
  const [matrix, setMatrix] = useState<PermissionMatrix>(DEFAULT_MATRIX)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('role, create_task, move_task, manage_users, manage_resources, manage_catalogs, manage_crm, manage_social')
    if (!error && data) {
      const next: PermissionMatrix = { ...DEFAULT_MATRIX }
      for (const r of data as PermissionRow[]) {
        next[r.role] = {
          create_task: r.create_task,
          move_task: r.move_task,
          manage_users: r.manage_users,
          manage_resources: r.manage_resources,
          manage_catalogs: r.manage_catalogs,
          manage_crm: r.manage_crm,
          manage_social: r.manage_social,
        }
      }
      next.admin = { ...ALL_TRUE } // admin sempre tudo
      setMatrix(next)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status !== 'authed') {
      setMatrix(DEFAULT_MATRIX)
      setLoading(false)
      return
    }
    refresh()
    const channel = supabase
      .channel('role_permissions:matrix')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, () => refresh())
      .subscribe()
    const timer = setInterval(refresh, POLL_MS)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [status, refresh])

  const can = useCallback(
    (cap: Capability) => (role === 'admin' ? true : matrix[role]?.[cap] ?? false),
    [role, matrix],
  )

  const updateRole = useCallback(
    async (target: Role, patch: Partial<RoleCaps>) => {
      // Otimista.
      setMatrix((prev) => ({ ...prev, [target]: { ...prev[target], ...patch } }))
      const { error } = await supabase.from('role_permissions').update(patch).eq('role', target)
      if (error) {
        await refresh()
        return { error: error.message }
      }
      return { error: null }
    },
    [refresh],
  )

  const value = useMemo<PermissionsCtx>(
    () => ({ matrix, loading, can, updateRole, refresh }),
    [matrix, loading, can, updateRole, refresh],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePermissions() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('usePermissions deve ser usado dentro de <PermissionsProvider>')
  return ctx
}
