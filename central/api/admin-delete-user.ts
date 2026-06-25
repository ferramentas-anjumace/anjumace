import { createClient } from '@supabase/supabase-js'

/* ----------------------------------------------------------------------------
   Função serverless (Vercel) — excluir usuário do time
   ----------------------------------------------------------------------------
   Roda no servidor com a SERVICE_ROLE (que NUNCA pode ir para o navegador).
   Fluxo:
     1. valida o token de quem chama e confirma que é gestor (admin/liderança);
     2. impede a auto-exclusão (ninguém apaga a própria conta);
     3. remove o usuário do Auth — a linha em public.profiles cai por cascata
        (FK on delete cascade).

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

  // 1) Quem está chamando? É gestor?
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
  if (profile.role !== 'admin' && profile.role !== 'lideranca') {
    res.status(403).json({ error: `Seu papel no banco é "${profile.role}" — só Administrador ou Liderança excluem usuários.` })
    return
  }

  // 2) Alvo da exclusão.
  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {}
  const id = String(body.id || '').trim()
  if (!id) {
    res.status(400).json({ error: 'Id do usuário é obrigatório.' })
    return
  }
  if (id === caller.user.id) {
    res.status(400).json({ error: 'Você não pode excluir a própria conta.' })
    return
  }

  // 3) Remove do Auth (cascateia o profile).
  const { error: delErr } = await admin.auth.admin.deleteUser(id)
  if (delErr) {
    res.status(400).json({ error: delErr.message || 'Falha ao excluir usuário.' })
    return
  }

  res.status(200).json({ ok: true })
}
