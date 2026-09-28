/* Encaminha leads pro ACF Builder (white label do GoHighLevel) via Inbound
   Webhook de um Workflow. Server-side pra URL do webhook nunca ir pro
   navegador. Tag e automação ficam no workflow do lado do ACF Builder.

   Compartilhado entre origens — cada uma manda `source` no body e usa a
   URL de webhook correspondente abaixo.

   Env (Vercel → Settings → Environment Variables):
     ACF_WEBHOOK_LISTA_ESPERA   URL do Inbound Webhook da lista de espera

   Sem a URL da origem responde 204 (no-op): a página continua funcionando
   só com o Supabase. */

const WEBHOOKS = {
  lista_espera: process.env.ACF_WEBHOOK_LISTA_ESPERA,
}

/* "+55 (11) 98765-4321" → "+5511987654321" */
function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const { name = '', email = '', phone = '', source = '' } = req.body ?? {}
  const url = WEBHOOKS[source]
  if (!url) return res.status(204).end()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'email' })
  }

  try {
    const hookRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(name).trim(),
        email: String(email).trim(),
        phone: normalizePhone(phone),
        source,
      }),
    })
    if (!hookRes.ok) throw new Error(`webhook ${hookRes.status}`)
    return res.status(200).json({ ok: true })
  } catch (err) {
    // Nunca derruba a conversão por causa do ACF — o lead já está no Supabase.
    return res.status(202).json({ ok: false, error: String(err?.message ?? err) })
  }
}
