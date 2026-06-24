import { createClient } from '@supabase/supabase-js'

/* ----------------------------------------------------------------------------
   Função serverless (Vercel) — criar usuário do time
   ----------------------------------------------------------------------------
   Roda no servidor com a SERVICE_ROLE (que NUNCA pode ir para o navegador).
   Fluxo:
     1. valida o token de quem chama e confirma que é admin (tabela profiles);
     2. cria o usuário no Auth com e-mail/senha (já confirmado);
     3. ajusta o profile (nome, papel, time).

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

  // 1) Quem está chamando? É admin?
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
  if (profile.role !== 'admin') {
    res.status(403).json({ error: `Seu papel no banco é "${profile.role}", não "admin".` })
    return
  }

  // 2) Cria o usuário.
  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {}
  const email = String(body.email || '').trim()
  const password = String(body.password || '')
  const name = String(body.name || '').trim()
  const role = body.role === 'admin' ? 'admin' : 'colaborador'
  const team = body.team ? String(body.team).trim() : null

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'A senha precisa de pelo menos 6 caracteres.' })
    return
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (createErr || !created.user) {
    res.status(400).json({ error: createErr?.message || 'Falha ao criar usuário.' })
    return
  }

  // 3) Ajusta o profile (o trigger já criou a linha; aqui garantimos os campos).
  await admin
    .from('profiles')
    .update({ name, role, team, email })
    .eq('id', created.user.id)

  res.status(200).json({ ok: true, id: created.user.id })
}
