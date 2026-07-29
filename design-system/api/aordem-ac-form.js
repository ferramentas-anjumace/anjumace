/* Encaminha o lead do Hotseat A Ordem pro formulário do Active Campaign
   (form id 1, conta anjumace58987) que dispara a automação de lembrete por
   SMS já configurada lá.

   Isso roda no servidor (não no navegador) porque o endpoint de formulário
   do Active (activehosted.com/proc.php) é feito pra POST clássico de
   <form> com redirect de página — chamado via fetch() direto do browser
   ele esbarra em CORS (o Active não libera Access-Control-Allow-Origin
   pra esse domínio), e o front acaba engolindo o erro silenciosamente sem
   o lead nunca chegar lá. Servidor-a-servidor não tem restrição de CORS.

   Nunca derruba a conversão por causa do Active — o lead já está no
   Supabase antes desta chamada acontecer. */

const ACTIVE_CAMPAIGN_ENDPOINT = 'https://anjumace58987.activehosted.com/proc.php'
const ACTIVE_CAMPAIGN_HIDDEN_FIELDS = {
  u: '1',
  f: '1',
  s: '',
  c: '0',
  m: '0',
  act: 'sub',
  v: '2',
  or: 'eac7aa95-72f5-496e-83bf-a108eb66e27f',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const { name = '', email = '', phone = '' } = req.body ?? {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'email' })
  }

  const body = new URLSearchParams(ACTIVE_CAMPAIGN_HIDDEN_FIELDS)
  body.append('fullname', name)
  body.append('email', email)
  body.append('phone', phone)
  body.append('sms_consent', '1')

  try {
    const acRes = await fetch(ACTIVE_CAMPAIGN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const text = await acRes.text()
    if (!acRes.ok) throw new Error(`HTTP ${acRes.status}: ${text.slice(0, 300)}`)
    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(202).json({ ok: false, error: String(err?.message ?? err) })
  }
}
