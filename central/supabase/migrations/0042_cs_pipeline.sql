-- ============================================================================
-- Comercial — Pipeline de CS (pós-venda)
-- ----------------------------------------------------------------------------
-- Pedido (2026-07-09): quando o comercial mover um lead para "Fechado - Ganho"
-- no CRM, o cliente cai AUTOMATICAMENTE no pipeline do CS para continuar a
-- tratativa (onboarding, acompanhamento, renovação).
--
--   1) Catálogo cs_status — colunas do kanban do CS (editável em Catálogos)
--   2) Tabela cs_cases — um caso de CS por lead ganho (FK crm_leads)
--   3) Trigger em crm_leads — status contendo "ganho" cria o caso na hora
--      (vale para arraste no kanban, edição no drawer e import CSV)
--
-- O caso NÃO duplica: lead_id é único; se o lead sair e voltar pra ganho, o
-- caso existente permanece. Dados de contato ficam no crm_leads (a UI junta).
--
-- RLS: como no CRM — todo o time lê; escrita/exclusão exige manage_crm.
-- O trigger é SECURITY DEFINER para criar o caso mesmo quando quem move o
-- lead não tiver insert direto em cs_cases.
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Catálogo de etapas do CS ---------------------------------------------
-- KPI: "Encerrado" é identificado pelo texto (contém "Encerrad") — ao renomear,
-- preserve a palavra (mesma convenção de Ganho/Perdido/Inativo no CRM).
insert into public.catalog_items (catalog, value, label, tone, sort)
select v.catalog, v.value, v.label, v.tone, v.sort
from (values
  ('cs_status','Onboarding','Onboarding','blue',0),
  ('cs_status','Acompanhamento','Acompanhamento','steel',1),
  ('cs_status','Renovação','Renovação','warning',2),
  ('cs_status','Encerrado','Encerrado','neutral',3)
) as v(catalog, value, label, tone, sort)
where not exists (
  select 1 from public.catalog_items c
   where c.catalog = v.catalog and c.value = v.value
);

-- ---- 2) Tabela de casos --------------------------------------------------------
create table if not exists public.cs_cases (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null unique references public.crm_leads (id) on delete cascade,
  status         text not null default 'Onboarding',  -- catálogo cs_status
  owner_id       uuid references public.profiles (id) on delete set null,
  notes          text,
  next_action_at date,
  sort           int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists cs_cases_status_idx on public.cs_cases (status, sort);
create index if not exists cs_cases_owner_idx  on public.cs_cases (owner_id);

drop trigger if exists cs_cases_touch on public.cs_cases;
create trigger cs_cases_touch before update on public.cs_cases
  for each row execute function public.crm_touch_updated_at();

-- ---- RLS + grants ---------------------------------------------------------------
alter table public.cs_cases enable row level security;

drop policy if exists cs_cases_select on public.cs_cases;
create policy cs_cases_select on public.cs_cases for select to authenticated
  using (true);

drop policy if exists cs_cases_insert on public.cs_cases;
create policy cs_cases_insert on public.cs_cases for insert to authenticated
  with check (public.can('manage_crm'));

drop policy if exists cs_cases_update on public.cs_cases;
create policy cs_cases_update on public.cs_cases for update to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

drop policy if exists cs_cases_delete on public.cs_cases;
create policy cs_cases_delete on public.cs_cases for delete to authenticated
  using (public.can('manage_crm'));

grant select, insert, update, delete on public.cs_cases to authenticated;
grant select, insert, update, delete on public.cs_cases to service_role;

-- ---- Realtime --------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'cs_cases'
  ) then
    execute 'alter publication supabase_realtime add table public.cs_cases';
  end if;
end $$;

-- ---- 3) Trigger: lead ganho → caso de CS -------------------------------------
create or replace function public.crm_lead_won_to_cs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Mesma convenção dos KPIs do CRM: "ganho" no texto do status.
  if new.status ~* 'ganho'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.cs_cases (lead_id, sort)
    values (
      new.id,
      coalesce((select max(sort) + 1 from public.cs_cases where status = 'Onboarding'), 0)
    )
    on conflict (lead_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists crm_leads_won_to_cs on public.crm_leads;
create trigger crm_leads_won_to_cs
  after insert or update of status on public.crm_leads
  for each row execute function public.crm_lead_won_to_cs();
