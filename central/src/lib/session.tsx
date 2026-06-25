import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/* ----------------------------------------------------------------------------
   Sessão / autenticação (Supabase Auth)
   ----------------------------------------------------------------------------
   O usuário loga com e-mail e senha (contas criadas pelo admin — não há
   cadastro aberto). O papel de acesso e o nome ficam no user_metadata do
   usuário no Supabase:

     { role: 'admin' | 'lideranca' | 'time', name: 'Fulano', member_id?: 'USR-1047' }

   - role:      define o que a pessoa enxerga. Administrador e Liderança são
                gestores (controle total); Time é membro comum.
   - name:      exibido na interface.
   - member_id: opcional — liga o login a um membro do time (USERS em data.ts),
                usado para "Minhas tarefas". Sem ele, o id é o uuid do Supabase.
---------------------------------------------------------------------------- */

export type Role = 'admin' | 'lideranca' | 'time'

/** Rótulo exibido para cada papel. */
export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  lideranca: 'Liderança',
  time: 'Time',
}

/** Gestores (acesso administrativo): Administrador e Liderança. */
export function isManagerRole(role: Role): boolean {
  return role === 'admin' || role === 'lideranca'
}

export interface Profile {
  /** Id usado no app — member_id (se houver) ou o uuid do Supabase. */
  id: string
  /** UUID real do Supabase Auth — sempre casa com a linha em public.profiles. */
  userId: string
  name: string
  email: string
  roleLabel: string
}

/** Estado da sessão para a tela de carregamento / guarda de rota. */
export type AuthStatus = 'loading' | 'authed' | 'anon'

const EMPTY_PROFILE: Profile = { id: '', userId: '', name: '', email: '', roleLabel: '' }

function profileFromSession(session: Session | null): { profile: Profile; role: Role } {
  const u = session?.user
  if (!u) return { profile: EMPTY_PROFILE, role: 'time' }
  const meta = (u.user_metadata ?? {}) as { role?: string; name?: string; member_id?: string }
  // Mapeia o valor cru do metadata (tolerando o antigo 'colaborador' → 'time').
  const role: Role = meta.role === 'admin' ? 'admin' : meta.role === 'lideranca' ? 'lideranca' : 'time'
  const email = u.email ?? ''
  return {
    profile: {
      id: meta.member_id || u.id,
      userId: u.id,
      name: meta.name || email.split('@')[0] || 'Usuário',
      email,
      roleLabel: ROLE_LABEL[role],
    },
    role,
  }
}

interface SessionCtx {
  status: AuthStatus
  role: Role
  /** Atalho: papel é de gestor (Administrador ou Liderança). */
  isManager: boolean
  user: Profile
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const Context = createContext<SessionCtx | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setStatus(data.session ? 'authed' : 'anon')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setStatus(newSession ? 'authed' : 'anon')
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const { profile, role } = useMemo(() => profileFromSession(session), [session])

  const value = useMemo<SessionCtx>(
    () => ({ status, role, isManager: isManagerRole(role), user: profile, signIn, signOut }),
    [status, role, profile, signIn, signOut],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSession() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useSession deve ser usado dentro de <SessionProvider>')
  return ctx
}
