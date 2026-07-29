-- ============================================================================
-- Funil de Atração — adiciona WhatsApp na captura do guia (/guia)
-- ----------------------------------------------------------------------------
-- Pedido do usuário (29/07): a página de Captação passa a coletar WhatsApp
-- também (não só nome/e-mail), reaproveitando o mesmo padrão de máscara e
-- seletor de país da Lista de Espera/Hotseat A Ordem.
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

alter table public.funnel_leads add column if not exists whatsapp text;

create or replace function public.funil_guia_signup(
  p_name     text,
  p_email    text,
  p_whatsapp text default null,
  p_utm      jsonb default '{}'::jsonb,
  p_referrer text default null,
  p_page     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name  text := left(btrim(coalesce(p_name, '')), 120);
  v_email text := left(lower(btrim(coalesce(p_email, ''))), 160);
begin
  if length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'nome');
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;

  insert into public.funnel_leads
    (name, email, whatsapp, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, page)
  values (
    v_name, v_email, left(p_whatsapp, 40),
    left(p_utm->>'utm_source', 120),   left(p_utm->>'utm_medium', 120),
    left(p_utm->>'utm_campaign', 120), left(p_utm->>'utm_content', 120),
    left(p_utm->>'utm_term', 120),
    left(p_referrer, 300), left(p_page, 120)
  )
  on conflict (email) do update
    set signup_count = funnel_leads.signup_count + 1,
        last_seen_at = now(),
        name = coalesce(nullif(excluded.name, ''), funnel_leads.name),
        whatsapp = coalesce(nullif(excluded.whatsapp, ''), funnel_leads.whatsapp);

  return jsonb_build_object('ok', true);
end $$;

-- Assinatura mudou (novo parâmetro p_whatsapp) — troca a função antiga.
drop function if exists public.funil_guia_signup(text, text, jsonb, text, text);

revoke all on function public.funil_guia_signup(text, text, text, jsonb, text, text) from public;
grant execute on function public.funil_guia_signup(text, text, text, jsonb, text, text) to anon, authenticated;
