/* Sincroniza leads com o ActiveCampaign (server-side: a API key nunca vai
   pro navegador). Upsert do contato + inscrição em lista + tag de
   segmentação; a tag dispara a automação que o Vittor montar no Active.

   Compartilhado entre origens (guia, lista de espera, ...) — cada uma manda
   `source` no body e recebe a tag/lista correspondente abaixo.

   Env (Vercel → Settings → Environment Variables):
     AC_API_URL              ex.: https://SEUCONTA.api-us1.com
     AC_API_KEY              chave da API v3

     # Origem "guia" (default quando `source` não é enviado)
     AC_TAG                  opcional — default "Lead - Funil de Atracao"
     AC_LIST_ID              opcional — default "3"

     # Origem "lista_espera"
     AC_TAG_LISTA_ESPERA     opcional — default "Lista de Espera"
     AC_LIST_ID_LEADS        opcional — ID numérico da lista "LEADS" no Active.
                              Default "3" (mesma lista do funil de atração).

   Sem AC_API_URL/AC_API_KEY responde 204 (no-op): a página continua
   funcionando só com o Supabase até o Active ser plugado. */

const SOURCES = {
  guia: {
    tag: process.env.AC_TAG || 'Lead - Funil de Atracao',
    tagDescription: 'Lead do e-book Os cinco tipos de falha',
    listId: process.env.AC_LIST_ID || '3',
    noteLabel: 'Origem do guia',
  },
  lista_espera: {
    tag: process.env.AC_TAG_LISTA_ESPERA || 'Lista de Espera',
    tagDescription: 'Lead da lista de espera da Anju Mace',
    listId: process.env.AC_LIST_ID_LEADS || '3',
    noteLabel: 'Origem da lista de espera',
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const base = process.env.AC_API_URL
  const key = process.env.AC_API_KEY
  if (!base || !key) return res.status(204).end()

  const { name = '', email = '', phone = '', utm = {}, source = 'guia' } = req.body ?? {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'email' })
  }

  const cfg = SOURCES[source] || SOURCES.guia
  const headers = { 'Api-Token': key, 'Content-Type': 'application/json' }
  const firstName = String(name).trim().split(/\s+/)[0] ?? ''
  const lastName = String(name).trim().split(/\s+/).slice(1).join(' ')

  try {
    // Upsert do contato
    const contactPayload = { email, firstName, lastName }
    if (phone) contactPayload.phone = phone
    const syncRes = await fetch(`${base}/api/3/contact/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ contact: contactPayload }),
    })
    if (!syncRes.ok) throw new Error(`contact/sync ${syncRes.status}`)
    const { contact } = await syncRes.json()

    // Inscrição na lista (status 1 = subscribed) — necessária pra receber e-mail.
    if (cfg.listId) {
      await fetch(`${base}/api/3/contactLists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contactList: { list: Number(cfg.listId), contact: contact.id, status: 1 } }),
      })
    }

    // Tag de segmentação (cria se não existir, aplica sempre)
    const tagName = cfg.tag
    const tagRes = await fetch(`${base}/api/3/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tag: { tag: tagName, tagType: 'contact', description: cfg.tagDescription } }),
    })
    let tagId = null
    if (tagRes.ok) tagId = (await tagRes.json())?.tag?.id
    if (!tagId) {
      const found = await fetch(`${base}/api/3/tags?search=${encodeURIComponent(tagName)}`, { headers })
      if (found.ok) tagId = (await found.json())?.tags?.find((t) => t.tag === tagName)?.id
    }
    if (tagId) {
      await fetch(`${base}/api/3/contactTags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contactTag: { contact: contact.id, tag: tagId } }),
      })
    }

    // UTMs como nota (atribuição visível no perfil do contato)
    const utmPairs = Object.entries(utm).filter(([, v]) => v)
    if (utmPairs.length > 0) {
      await fetch(`${base}/api/3/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          note: {
            note: `${cfg.noteLabel}: ` + utmPairs.map(([k, v]) => `${k}=${v}`).join(' · '),
            relid: contact.id,
            reltype: 'Subscriber',
          },
        }),
      })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    // Nunca derruba a conversão por causa do Active — o lead já está no Supabase.
    return res.status(202).json({ ok: false, error: String(err?.message ?? err) })
  }
}
