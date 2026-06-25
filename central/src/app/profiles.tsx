import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Time / membros (tabela public.profiles no Supabase)
   ----------------------------------------------------------------------------
   Carrega os usuários reais para preencher seletores de responsáveis, avatares
   e a futura tela de Usuários. Atualiza quando a sessão fica autenticada.
---------------------------------------------------------------------------- */

export type MemberRole = 'admin' | 'lideranca' | 'time'
export type MemberStatus = 'ativo' | 'convidado' | 'suspenso'

export interface Member {
  id: string
  name: string
  email: string | null
  role: MemberRole
  team: string | null
  status: MemberStatus
  /** Foto do usuário (data URL). Enviada pelo admin ou pelo próprio usuário. */
  avatar: string | null
}

/** Dados para criar um novo usuário (via função serverless). */
export interface NewUserInput {
  email: string
  password: string
  name: string
  role: MemberRole
  team?: string
}

/** Campos editáveis de um membro. */
export type MemberPatch = Partial<Pick<Member, 'name' | 'role' | 'team' | 'status' | 'avatar'>>

interface ProfilesCtx {
  members: Member[]
  loading: boolean
  getMember: (id: string) => Member | undefined
  refresh: () => Promise<void>
  updateMember: (id: string, patch: MemberPatch) => Promise<{ error: string | null }>
  /** Salva a foto (data URL, ou null para remover) de um membro. */
  setMemberAvatar: (id: string, avatar: string | null) => Promise<{ error: string | null }>
  createUser: (input: NewUserInput) => Promise<{ error: string | null }>
}

const Context = createContext<ProfilesCtx | null>(null)

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, team, status, avatar')
      .order('name')
    if (error) {
      console.error('[profiles] erro ao carregar membros:', error.message, error)
    } else {
      console.info('[profiles] membros carregados:', data?.length ?? 0)
      setMembers((data ?? []) as Member[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      refresh()
    } else if (status === 'anon') {
      setMembers([])
      setLoading(false)
    }
  }, [status, refresh])

  const getMember = useCallback((id: string) => members.find((m) => m.id === id), [members])

  const updateMember = useCallback(
    async (id: string, patch: MemberPatch) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id)
      if (error) return { error: error.message }
      await refresh()
      return { error: null }
    },
    [refresh],
  )

  /** Atualiza só a foto. Funciona tanto para o admin (qualquer membro) quanto
      para o próprio usuário (a policy `profiles_self_update` cobre a si mesmo). */
  const setMemberAvatar = useCallback(
    async (id: string, avatar: string | null) => {
      const { error } = await supabase.from('profiles').update({ avatar }).eq('id', id)
      if (error) return { error: error.message }
      await refresh()
      return { error: null }
    },
    [refresh],
  )

  /** Cria um usuário via função serverless (precisa da service_role no servidor). */
  const createUser = useCallback(
    async (input: NewUserInput) => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      try {
        const res = await fetch('/api/admin-create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(input),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) return { error: body.error ?? `Falha ao criar usuário (${res.status})` }
        await refresh()
        return { error: null }
      } catch {
        return { error: 'Não foi possível contatar o servidor (a criação de usuários só funciona em produção).' }
      }
    },
    [refresh],
  )

  const value = useMemo<ProfilesCtx>(
    () => ({ members, loading, getMember, refresh, updateMember, setMemberAvatar, createUser }),
    [members, loading, getMember, refresh, updateMember, setMemberAvatar, createUser],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useProfiles() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useProfiles deve ser usado dentro de <ProfilesProvider>')
  return ctx
}
