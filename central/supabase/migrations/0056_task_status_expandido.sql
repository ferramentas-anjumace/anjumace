-- ============================================================================
-- Central Anju — status expandidos de Tarefas (padrão ClickUp)
-- ----------------------------------------------------------------------------
-- Antes: 'a-fazer' | 'em-andamento' | 'em-revisao' | 'concluida'.
-- Agora: 'backlog' | 'pendente' | 'em-progresso' | 'em-revisao-interna' |
--        'em-revisao-anju' | 'em-ajustes' | 'cancelado' | 'concluida'.
--
-- Mapeamento das tarefas existentes:
--   a-fazer      → pendente
--   em-andamento → em-progresso
--   em-revisao   → em-revisao-interna
--   concluida    → concluida (sem mudança)
-- Nenhuma tarefa existente vira 'backlog' ou 'cancelado' automaticamente —
-- não há equivalente anterior pra esses dois.
--
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.tasks drop constraint if exists tasks_status_check;

update public.tasks set status = 'pendente' where status = 'a-fazer';
update public.tasks set status = 'em-progresso' where status = 'em-andamento';
update public.tasks set status = 'em-revisao-interna' where status = 'em-revisao';

alter table public.tasks alter column status set default 'backlog';

alter table public.tasks
  add constraint tasks_status_check
  check (status in (
    'backlog','pendente','em-progresso','em-revisao-interna',
    'em-revisao-anju','em-ajustes','cancelado','concluida'
  ));
