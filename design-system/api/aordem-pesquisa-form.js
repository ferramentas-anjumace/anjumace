/* Encaminha as respostas da pesquisa "leads core" pro formulário do Active
   Campaign que a Miranda montou (form id 5, conta anjumace58987) — mesma
   razão do aordem-ac-form.js: o endpoint de formulário do Active é feito
   pra POST clássico de <form>, e via fetch() direto do navegador esbarra
   em CORS. Só a estrutura de campos foi reaproveitada do script dela; o
   design/CSS do formulário original foi descartado (pedido do usuário
   29/07) — o pop-up usa os componentes da própria página.

   Nunca derruba a experiência por causa do Active — a vaga já foi
   confirmada no Supabase antes desta chamada acontecer; a pesquisa é
   informação extra. */

const ACTIVE_CAMPAIGN_ENDPOINT = 'https://anjumace58987.activehosted.com/proc.php'
const ACTIVE_CAMPAIGN_HIDDEN_FIELDS = {
  u: '5',
  f: '5',
  s: '',
  c: '0',
  m: '0',
  act: 'sub',
  v: '2',
  or: '5bf56b99-b489-4623-85ac-d8dc5a37c7d8',
}

// field[N][] — múltipla escolha (checkbox); field[N] — resposta única.
const MULTI_FIELDS = ['31', '32', '33', '34', '35']
const SINGLE_FIELDS = ['18', '21', '22', '23', '24', '26', '27']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const { email = '', name = '', phone = '', answers = {}, smsConsent = false } = req.body ?? {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'email' })
  }

  const body = new URLSearchParams(ACTIVE_CAMPAIGN_HIDDEN_FIELDS)
  body.append('email', email)
  if (name) body.append('firstname', name)
  if (phone) body.append('phone', phone)
  if (smsConsent) body.append('sms_consent', '1')

  for (const id of MULTI_FIELDS) {
    // "~|" é o marcador do Active pra "campo presente, nada marcado".
    body.append(`field[${id}][]`, '~|')
    for (const v of answers[id] ?? []) body.append(`field[${id}][]`, v)
  }
  for (const id of SINGLE_FIELDS) {
    if (answers[id]) body.append(`field[${id}]`, answers[id])
  }

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
