/* Sincroniza o lead do guia com o ActiveCampaign (server-side: a API key
   nunca vai pro navegador). Upsert do contato + tag de segmentação; a tag
   dispara a automação de entrega/nutrição que o Vittor montar no Active.

   Env (Vercel → Settings → Environment Variables):
     AC_API_URL   ex.: https://SEUCONTA.api-us1.com
     AC_API_KEY   chave da API v3
     AC_TAG       opcional — nome da tag (default: "guia-cinco-falhas")
     AC_LIST_ID   opcional — ID da lista pra inscrever o contato (o Active
                  só entrega e-mail pra contato inscrito em alguma lista)

   Sem envs configuradas responde 204 (no-op): a página continua funcionando
   só com o Supabase até o Active ser plugado. */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const base = process.env.AC_API_URL
  const key = process.env.AC_API_KEY
  if (!base || !key) return res.status(204).end()

  const { name = '', email = '', utm = {} } = req.body ?? {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'email' })
  }

  const headers = { 'Api-Token': key, 'Content-Type': 'application/json' }
  const firstName = String(name).trim().split(/\s+/)[0] ?? ''
  const lastName = String(name).trim().split(/\s+/).slice(1).join(' ')

  try {
    // Upsert do contato
    const syncRes = await fetch(`${base}/api/3/contact/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ contact: { email, firstName, lastName } }),
    })
    if (!syncRes.ok) throw new Error(`contact/sync ${syncRes.status}`)
    const { contact } = await syncRes.json()

    // Inscrição na lista (status 1 = subscribed) — necessária pra receber e-mail.
    const listId = process.env.AC_LIST_ID
    if (listId) {
      await fetch(`${base}/api/3/contactLists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contactList: { list: Number(listId), contact: contact.id, status: 1 } }),
      })
    }

    // Tag de segmentação (cria se não existir, aplica sempre)
    const tagName = process.env.AC_TAG || 'guia-cinco-falhas'
    const tagRes = await fetch(`${base}/api/3/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tag: { tag: tagName, tagType: 'contact', description: 'Lead do e-book Os cinco tipos de falha' } }),
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
            note: 'Origem do guia: ' + utmPairs.map(([k, v]) => `${k}=${v}`).join(' · '),
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
