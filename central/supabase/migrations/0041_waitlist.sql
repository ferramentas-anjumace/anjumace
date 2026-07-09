-- ============================================================================
-- Comercial — Lista de Espera separada do CRM (aba própria na Central)
-- ----------------------------------------------------------------------------
-- Pedido (2026-07-09): os leads do CRM são negociação em andamento; a lista de
-- espera é aquecimento (entram pela landing /lista-de-espera e são trabalhados
-- antes de virarem lead de venda). Então:
--
--   1) Nova tabela public.waitlist_leads — inscrições da lista de espera
--   2) lista_espera_signup passa a gravar NELA (não mais em crm_leads)
--   3) Migra para a nova tabela os leads que já caíram no CRM com origem
--      'Lista de Espera' (e os remove do CRM)
--
-- "Promover pro CRM" (quando o lead esquenta) é feito pela Central: cria o
-- crm_lead e carimba promoted_lead_id/promoted_at na inscrição.
--
-- RLS: como no CRM — todo o time autenticado lê; escrita/exclusão exige
-- public.can('manage_crm'). O visitante anônimo só entra pela função
-- SECURITY DEFINER (a tabela continua fechada para anon).
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Tabela ---------------------------------------------------------------
create table if not exists public.waitlist_leads (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  whatsapp         text,
  notes            text,
  -- Preenchidos quando o lead é promovido para o CRM pela Central.
  promoted_lead_id uuid references public.crm_leads (id) on delete set null,
  promoted_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists waitlist_leads_created_idx
  on public.waitlist_leads (created_at desc);

-- Mantém updated_at fresco (mesma função do CRM, criada na 0028).
drop trigger if exists waitlist_leads_touch on public.waitlist_leads;
create trigger waitlist_leads_touch before update on public.waitlist_leads
  for each row execute function public.crm_touch_updated_at();

-- ---- RLS + grants ------------------------------------------------------------
alter table public.waitlist_leads enable row level security;

drop policy if exists waitlist_leads_select on public.waitlist_leads;
create policy waitlist_leads_select on public.waitlist_leads for select to authenticated
  using (true);

drop policy if exists waitlist_leads_insert on public.waitlist_leads;
create policy waitlist_leads_insert on public.waitlist_leads for insert to authenticated
  with check (public.can('manage_crm'));

drop policy if exists waitlist_leads_update on public.waitlist_leads;
create policy waitlist_leads_update on public.waitlist_leads for update to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

drop policy if exists waitlist_leads_delete on public.waitlist_leads;
create policy waitlist_leads_delete on public.waitlist_leads for delete to authenticated
  using (public.can('manage_crm'));

grant select, insert, update, delete on public.waitlist_leads to authenticated;
grant select, insert, update, delete on public.waitlist_leads to service_role;

-- ---- Realtime ------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'waitlist_leads'
  ) then
    execute 'alter publication supabase_realtime add table public.waitlist_leads';
  end if;
end $$;

-- ---- 2) Função de captura passa a gravar na lista de espera -------------------
create or replace function public.lista_espera_signup(
  p_name     text,
  p_email    text,
  p_whatsapp text
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
  v_existing uuid;
begin
  if length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'nome');
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;
  if length(v_digits) < 10 then
    return jsonb_build_object('ok', false, 'error', 'whatsapp');
  end if;

  -- Dedupe por e-mail ou WhatsApp (só dígitos) — reinscrição vira nota.
  select id into v_existing
    from public.waitlist_leads
   where (email is not null and lower(email) = v_email)
      or (whatsapp is not null
          and regexp_replace(whatsapp, '\D', '', 'g') = v_digits)
   order by created_at desc
   limit 1;

  if v_existing is not null then
    update public.waitlist_leads
       set notes = coalesce(notes || E'\n', '')
                   || 'Reinscrição em '
                   || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
     where id = v_existing;
    return jsonb_build_object('ok', true, 'duplicated', true);
  end if;

  insert into public.waitlist_leads (name, email, whatsapp)
  values (v_name, v_email, v_whatsapp);

  return jsonb_build_object('ok', true, 'duplicated', false);
end $$;

revoke all on function public.lista_espera_signup(text, text, text) from public;
grant execute on function public.lista_espera_signup(text, text, text) to anon, authenticated;

-- ---- 3) Migra os leads que já caíram no CRM com origem 'Lista de Espera' ------
-- (vieram da landing antes desta migration; dedupe por e-mail p/ idempotência)
insert into public.waitlist_leads (name, email, whatsapp, notes, created_at)
select l.name, l.email, l.whatsapp, l.notes, l.created_at
  from public.crm_leads l
 where l.origin = 'Lista de Espera'
   and not exists (
     select 1 from public.waitlist_leads w
      where (w.email is not null and w.email = lower(coalesce(l.email, '')))
         or (w.whatsapp is not null and l.whatsapp is not null
             and regexp_replace(w.whatsapp, '\D', '', 'g')
               = regexp_replace(l.whatsapp, '\D', '', 'g'))
   );

delete from public.crm_leads where origin = 'Lista de Espera';
