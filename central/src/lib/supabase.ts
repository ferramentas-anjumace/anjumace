import { createClient } from '@supabase/supabase-js'

/* ----------------------------------------------------------------------------
   Cliente Supabase
   ----------------------------------------------------------------------------
   Lê a URL e a chave pública (anon) das variáveis de ambiente do Vite. Essas
   duas são públicas por natureza (vão para o bundle do cliente) — a segurança
   real fica nas policies (RLS) do Supabase. A service_role NUNCA entra aqui.
---------------------------------------------------------------------------- */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Indica se as variáveis de ambiente foram configuradas. */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Aviso amigável em dev — a tela de login mostra instruções.
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não definidas. ' +
      'Configure em .env.local (e no Vercel) para habilitar o login.',
  )
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
