-- ============================================================================
-- CS — Registro de atendimentos do Suporte
-- ----------------------------------------------------------------------------
-- Pedido (All Hands 2026-07-14): o suporte registra todos os atendimentos em
-- planilha (data, hora, status da resolução). Esse registro vira parte do
-- módulo de CS na Central:
--
--   1) Catálogos support_channel / support_topic / support_status — canal,
--      tema e status editáveis em Catálogos (self-service)
--   2) Tabela cs_tickets — um registro por atendimento, com aluna opcional
--      (FK crm_leads) ou contato livre, quem atendeu, abertura e resolução
--
-- KPI: "Resolvido" é identificado pelo texto (contém "Resolvid") — mesma
-- convenção de Ganho/Encerrado no CRM/CS. Ao renomear, preserve a palavra.
--
-- RLS: como no CS — todo o time lê; escrita/exclusão exige manage_crm.
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Catálogos -----------------------------------------------------------
insert into public.catalog_items (catalog, value, label, tone, sort)
select v.catalog, v.value, v.label, v.tone, v.sort
from (values
  ('support_channel','WhatsApp','WhatsApp','steel',0),
  ('support_channel','Circle','Circle','blue',1),
  ('support_channel','E-mail','E-mail','graphite',2),
  ('support_channel','Instagram','Instagram','pink',3),
  ('support_channel','Outro','Outro','neutral',4),
  ('support_topic','Correção de exercício','Correção de exercício','steel',0),
  ('support_topic','Acesso','Acesso','teal',1),
  ('support_topic','Treino','Treino','sand',2),
  ('support_topic','Pagamento','Pagamento','warning',3),
  ('support_topic','Outro','Outro','neutral',4),
  ('support_status','Aberto','Aberto','warning',0),
  ('support_status','Em andamento','Em andamento','blue',1),
  ('support_status','Resolvido','Resolvido','success',2)
) as v(catalog, value, label, tone, sort)
where not exists (
  select 1 from public.catalog_items c
   where c.catalog = v.catalog and c.value = v.value
);

-- ---- 2) Tabela de atendimentos ---------------------------------------------
create table if not exists public.cs_tickets (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.crm_leads (id) on delete set null,
  contact     text,                                  -- nome livre quando a aluna não está no CRM
  channel     text not null default 'WhatsApp',      -- catálogo support_channel
  topic       text,                                  -- catálogo support_topic
  summary     text,                                  -- o que foi tratado / como resolveu
  status      text not null default 'Aberto',        -- catálogo support_status
  owner_id    uuid references public.profiles (id) on delete set null,
  opened_at   timestamptz not null default now(),
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cs_tickets_opened_idx on public.cs_tickets (opened_at desc);
create index if not exists cs_tickets_status_idx on public.cs_tickets (status);
create index if not exists cs_tickets_lead_idx   on public.cs_tickets (lead_id);

drop trigger if exists cs_tickets_touch on public.cs_tickets;
create trigger cs_tickets_touch before update on public.cs_tickets
  for each row execute function public.crm_touch_updated_at();

-- ---- RLS + grants -----------------------------------------------------------
alter table public.cs_tickets enable row level security;

drop policy if exists cs_tickets_select on public.cs_tickets;
create policy cs_tickets_select on public.cs_tickets for select to authenticated
  using (true);

drop policy if exists cs_tickets_insert on public.cs_tickets;
create policy cs_tickets_insert on public.cs_tickets for insert to authenticated
  with check (public.can('manage_crm'));

drop policy if exists cs_tickets_update on public.cs_tickets;
create policy cs_tickets_update on public.cs_tickets for update to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

drop policy if exists cs_tickets_delete on public.cs_tickets;
create policy cs_tickets_delete on public.cs_tickets for delete to authenticated
  using (public.can('manage_crm'));

grant select, insert, update, delete on public.cs_tickets to authenticated;
grant select, insert, update, delete on public.cs_tickets to service_role;

-- ---- Realtime ----------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'cs_tickets'
  ) then
    execute 'alter publication supabase_realtime add table public.cs_tickets';
  end if;
end $$;
