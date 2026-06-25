-- ============================================================================
-- Central Anju — subtarefas / checklist nas tarefas
-- ----------------------------------------------------------------------------
-- Adiciona a coluna `checklist` (jsonb) na tabela tasks. Cada item:
--   { "id": "...", "text": "...", "done": false }
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.tasks
  add column if not exists checklist jsonb not null default '[]'::jsonb;
