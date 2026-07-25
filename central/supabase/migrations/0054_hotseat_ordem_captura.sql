-- ============================================================================
-- Hotseat "A Ordem" — captura da landing /aordem-captura (design-system)
-- ----------------------------------------------------------------------------
-- Novo projeto (Hotseat A Ordem, 30/07), evento ao vivo no Zoom. Leads ficam
-- numa tabela própria (hotseat_ordem_leads), separada do CRM e dos outros
-- funis: aqui o campo que importa é o WhatsApp (lembrete 1h antes do
-- encontro), então o schema segue o padrão da lista_espera (nome/e-mail/
-- WhatsApp) somado às UTMs do funil_guia (atribuição).
--
--   1) Tabela public.hotseat_ordem_leads
--   2) RPC public.hotseat_ordem_signup — única porta de escrita pro anon;
--      dedupe por e-mail (recaptura atualiza WhatsApp/UTM, não duplica)
--   3) Leitura pro time autenticado (aba futura na Central, se fizer sentido)
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

create table if not exists public.hotseat_ordem_leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  whatsapp      text not null,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  referrer      text,
  page          text,                        -- rota onde converteu (/aordem-captura)
  signup_count  int  not null default 1,     -- recapturas do mesmo e-mail
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists hotseat_ordem_leads_created_idx on public.hotseat_ordem_leads (created_at desc);
create index if not exists hotseat_ordem_leads_utm_source_idx on public.hotseat_ordem_leads (utm_source);

alter table public.hotseat_ordem_leads enable row level security;

-- Time autenticado lê; escrita/exclusão do time exige manage_crm (mesmo
-- gate usado nas outras tabelas de lead pública).
drop policy if exists hotseat_ordem_leads_select on public.hotseat_ordem_leads;
create policy hotseat_ordem_leads_select on public.hotseat_ordem_leads for select to authenticated
  using (true);

drop policy if exists hotseat_ordem_leads_update on public.hotseat_ordem_leads;
create policy hotseat_ordem_leads_update on public.hotseat_ordem_leads for update to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

drop policy if exists hotseat_ordem_leads_delete on public.hotseat_ordem_leads;
create policy hotseat_ordem_leads_delete on public.hotseat_ordem_leads for delete to authenticated
  using (public.can('manage_crm'));

grant select, update, delete on public.hotseat_ordem_leads to authenticated;
grant select, insert, update, delete on public.hotseat_ordem_leads to service_role;

-- ---- RPC de captura (anon) ----------------------------------------------------
create or replace function public.hotseat_ordem_signup(
  p_name     text,
  p_email    text,
  p_whatsapp text,
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
  v_name     text := left(btrim(coalesce(p_name, '')), 120);
  v_email    text := left(lower(btrim(coalesce(p_email, ''))), 160);
  v_whatsapp text := left(btrim(coalesce(p_whatsapp, '')), 40);
  v_digits   text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
begin
  if length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'nome');
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;
  if length(v_digits) < 8 then
    return jsonb_build_object('ok', false, 'error', 'whatsapp');
  end if;

  insert into public.hotseat_ordem_leads
    (name, email, whatsapp, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, page)
  values (
    v_name, v_email, v_whatsapp,
    left(p_utm->>'utm_source', 120),   left(p_utm->>'utm_medium', 120),
    left(p_utm->>'utm_campaign', 120), left(p_utm->>'utm_content', 120),
    left(p_utm->>'utm_term', 120),
    left(p_referrer, 300), left(p_page, 120)
  )
  on conflict (email) do update
    set signup_count = hotseat_ordem_leads.signup_count + 1,
        last_seen_at = now(),
        whatsapp = excluded.whatsapp,
        name = coalesce(nullif(excluded.name, ''), hotseat_ordem_leads.name);

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.hotseat_ordem_signup(text, text, text, jsonb, text, text) from public;
grant execute on function public.hotseat_ordem_signup(text, text, text, jsonb, text, text) to anon, authenticated;
