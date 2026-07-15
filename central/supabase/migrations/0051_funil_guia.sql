-- ============================================================================
-- Funil de Atração — captura do guia "Os cinco tipos de falha" (/guia)
-- ----------------------------------------------------------------------------
-- Leads do e-book ficam numa tabela própria (funnel_leads), separados do CRM
-- e da lista de espera: é topo de funil frio, com UTMs pra atribuição (pedido
-- da All Hands: rastrear origem de leads/compradores). O envio pro
-- ActiveCampaign acontece no front (serverless /api/ac-sync); aqui é a cópia
-- que fica em casa.
--
--   1) Tabela public.funnel_leads (nome, e-mail, UTMs, referrer, página)
--   2) RPC public.funil_guia_signup — única porta de escrita pro anon;
--      dedupe por e-mail (recaptura incrementa contador, não duplica)
--   3) Leitura pro time autenticado (aba futura na Central)
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

create table if not exists public.funnel_leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  referrer      text,
  page          text,                        -- rota onde converteu (/guia)
  signup_count  int  not null default 1,     -- recapturas do mesmo e-mail
  crm_lead_id   uuid references public.crm_leads (id) on delete set null,
  promoted_at   timestamptz,                 -- quando foi promovido pro CRM
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists funnel_leads_created_idx on public.funnel_leads (created_at desc);
create index if not exists funnel_leads_utm_source_idx on public.funnel_leads (utm_source);

alter table public.funnel_leads enable row level security;

-- Time autenticado lê; escrita/promocão do time exige manage_crm.
drop policy if exists funnel_leads_select on public.funnel_leads;
create policy funnel_leads_select on public.funnel_leads for select to authenticated
  using (true);

drop policy if exists funnel_leads_update on public.funnel_leads;
create policy funnel_leads_update on public.funnel_leads for update to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

drop policy if exists funnel_leads_delete on public.funnel_leads;
create policy funnel_leads_delete on public.funnel_leads for delete to authenticated
  using (public.can('manage_crm'));

grant select, update, delete on public.funnel_leads to authenticated;
grant select, insert, update, delete on public.funnel_leads to service_role;

-- ---- RPC de captura (anon) ----------------------------------------------------
create or replace function public.funil_guia_signup(
  p_name     text,
  p_email    text,
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
    (name, email, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, page)
  values (
    v_name, v_email,
    left(p_utm->>'utm_source', 120),   left(p_utm->>'utm_medium', 120),
    left(p_utm->>'utm_campaign', 120), left(p_utm->>'utm_content', 120),
    left(p_utm->>'utm_term', 120),
    left(p_referrer, 300), left(p_page, 120)
  )
  on conflict (email) do update
    set signup_count = funnel_leads.signup_count + 1,
        last_seen_at = now(),
        name = coalesce(nullif(excluded.name, ''), funnel_leads.name);

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.funil_guia_signup(text, text, jsonb, text, text) from public;
grant execute on function public.funil_guia_signup(text, text, jsonb, text, text) to anon, authenticated;
