-- ============================================================================
-- Central Anju — CRM: histórico automático de mudança de status
-- ----------------------------------------------------------------------------
-- Pedido (2026-07-21): ao mover um lead de uma coluna do kanban pra outra (ex.:
-- Novo → Fechado - Ganho), registrar quem fez e quando. É um LOG DE AUDITORIA
-- — diferente de crm_interactions, que é anotação manual do time.
--
-- Trigger em crm_leads grava uma linha por mudança de `status`, cobrindo tanto
-- o arraste no kanban quanto a edição do campo Status no drawer/planilha.
-- `changed_by` vem de auth.uid() no momento da escrita (o trigger é SECURITY
-- DEFINER só pra poder inserir mesmo sob a RLS restrita da tabela; auth.uid()
-- continua refletindo o usuário que fez a chamada, não o dono da função).
--
-- RLS: leitura para todo o time autenticado; ESCRITA só pelo trigger — ninguém
-- edita o histórico manualmente (por isso não há policy de insert/update/
-- delete para authenticated).
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

create table if not exists public.crm_status_history (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.crm_leads (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references public.profiles (id) on delete set null,
  changed_at  timestamptz not null default now()
);

create index if not exists crm_status_history_lead_idx
  on public.crm_status_history (lead_id, changed_at desc);

-- ---- RLS + grants -----------------------------------------------------------
alter table public.crm_status_history enable row level security;

drop policy if exists crm_status_history_select on public.crm_status_history;
create policy crm_status_history_select on public.crm_status_history for select to authenticated
  using (true);

grant select on public.crm_status_history to authenticated;
grant select, insert on public.crm_status_history to service_role;

-- ---- Trigger: uma linha por mudança de status --------------------------------
create or replace function public.crm_log_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.crm_status_history (lead_id, from_status, to_status, changed_by)
  values (new.id, old.status, new.status, auth.uid());
  return new;
end $$;

drop trigger if exists crm_leads_log_status on public.crm_leads;
create trigger crm_leads_log_status
  after update of status on public.crm_leads
  for each row
  when (old.status is distinct from new.status)
  execute function public.crm_log_status_change();

-- ---- Realtime (entrega ao vivo pro drawer aberto) ----------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'crm_status_history'
  ) then
    execute 'alter publication supabase_realtime add table public.crm_status_history';
  end if;
end $$;
