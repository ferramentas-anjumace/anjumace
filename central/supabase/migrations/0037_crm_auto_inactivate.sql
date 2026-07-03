-- ============================================================================
-- CRM — automação: 7 dias em "Primeira mensagem enviada" → "Inativo"
-- ----------------------------------------------------------------------------
-- Pedido (checkpoint pós-2026-07-03): lead que fica 7 dias parado na etapa
-- "Primeira mensagem enviada" (sem resposta) deve ir sozinho para "Inativo",
-- para não sujar o pipeline. Roda 1x/dia via pg_cron, tudo dentro do Postgres.
--
-- Depende da migration 0036 (que cria a etapa "Primeira mensagem enviada").
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Marca QUANDO o status mudou (updated_at muda em qualquer edição) ----
alter table public.crm_leads
  add column if not exists status_changed_at timestamptz not null default now();

-- Só atualiza status_changed_at quando o status realmente muda.
create or replace function public.crm_mark_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists crm_leads_status_change on public.crm_leads;
create trigger crm_leads_status_change before update on public.crm_leads
  for each row execute function public.crm_mark_status_change();

-- Backfill: aproxima pela última atualização conhecida (melhor que "agora").
update public.crm_leads
   set status_changed_at = coalesce(updated_at, created_at);

-- ---- 2) A automação: move os parados há 7+ dias para "Inativo" --------------
-- Retorna quantos leads foram movidos (útil para rodar manualmente e testar).
create or replace function public.crm_auto_inactivate()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare moved integer;
begin
  update public.crm_leads
     set status = 'Inativo'
   where status = 'Primeira mensagem enviada'
     and status_changed_at <= now() - interval '7 days';
  get diagnostics moved = row_count;
  return moved;
end $$;

-- ---- 3) Agenda diária via pg_cron ------------------------------------------
create extension if not exists pg_cron;

-- Remove agendamento anterior (idempotência) e recria.
do $$
begin
  perform cron.unschedule('crm-auto-inactivate');
exception when others then
  null; -- ainda não existia
end $$;

-- Todo dia às 11:00 UTC (08:00 BRT). Ajuste o horário se quiser.
select cron.schedule(
  'crm-auto-inactivate',
  '0 11 * * *',
  $$ select public.crm_auto_inactivate(); $$
);

-- ============================================================================
-- Teste manual (opcional): roda a automação agora e mostra quantos moveu.
--   select public.crm_auto_inactivate();
-- Ver o agendamento:
--   select jobname, schedule, active from cron.job where jobname = 'crm-auto-inactivate';
-- Ver execuções recentes:
--   select * from cron.job_run_details order by start_time desc limit 5;
-- ============================================================================
