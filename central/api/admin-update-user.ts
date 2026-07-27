import { createClient } from '@supabase/supabase-js'

/* ----------------------------------------------------------------------------
   Função serverless (Vercel) — alterar e-mail/senha de um usuário do time
   ----------------------------------------------------------------------------
   Roda no servidor com a SERVICE_ROLE (que NUNCA pode ir para o navegador).
   Fluxo:
     1. valida o token de quem chama e confirma que tem "Gerir usuários";
     2. atualiza e-mail e/ou senha no Auth (o que vier preenchido);
     3. se o e-mail mudou, sincroniza public.profiles.email também.

   Variáveis de ambiente exigidas no Vercel (Production/Preview/Development):
     - SUPABASE_URL                (mesma URL do projeto)
     - SUPABASE_SERVICE_ROLE_KEY   (Project Settings → API → service_role · SECRETA)
---------------------------------------------------------------------------- */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    res.status(500).json({ error: 'Servidor sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' })
    return
  }

  const token = String(req.headers.authorization || '').replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Não autenticado.' })
    return
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1) Quem está chamando? Tem permissão de gerir usuários?
  const { data: caller, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller.user) {
    res.status(401).json({ error: 'Sessão inválida.' })
    return
  }
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.user.id)
    .single()
  if (profErr || !profile) {
    res.status(403).json({
      error: `Não consegui ler seu perfil (uid ${caller.user.id}): ${profErr?.message ?? 'sem linha'}.`,
    })
    return
  }
  let allowed = profile.role === 'admin'
  if (!allowed) {
    const { data: perm } = await admin
      .from('role_permissions')
      .select('manage_users')
      .eq('role', profile.role)
      .single()
    allowed = perm?.manage_users === true
  }
  if (!allowed) {
    res.status(403).json({ error: `Seu papel ("${profile.role}") não tem permissão para gerir usuários.` })
    return
  }

  // 2) Alvo e alterações.
  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {}
  const id = String(body.id || '').trim()
  const email = body.email !== undefined ? String(body.email).trim() : undefined
  const password = body.password !== undefined ? String(body.password) : undefined

  if (!id) {
    res.status(400).json({ error: 'Id do usuário é obrigatório.' })
    return
  }
  if (!email && !password) {
    res.status(400).json({ error: 'Informe um novo e-mail e/ou uma nova senha.' })
    return
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'E-mail inválido.' })
    return
  }
  if (password && password.length < 6) {
    res.status(400).json({ error: 'A senha precisa de pelo menos 6 caracteres.' })
    return
  }

  // 3) Atualiza no Auth.
  const patch: { email?: string; password?: string } = {}
  if (email) patch.email = email
  if (password) patch.password = password

  const { error: updateErr } = await admin.auth.admin.updateUserById(id, patch)
  if (updateErr) {
    res.status(400).json({ error: updateErr.message || 'Falha ao atualizar usuário.' })
    return
  }

  // 4) Mantém public.profiles.email em sincronia.
  if (email) await admin.from('profiles').update({ email }).eq('id', id)

  res.status(200).json({ ok: true })
}
