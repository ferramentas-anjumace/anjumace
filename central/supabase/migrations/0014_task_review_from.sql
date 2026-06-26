-- ============================================================================
-- Central Anju — guarda o responsável original durante a revisão
-- ----------------------------------------------------------------------------
-- Ao enviar uma tarefa para "Em revisão", os responsáveis passam a ser os
-- administradores (quem revisa). Para devolver a tarefa a quem executou ao
-- sair da revisão (voltar para A fazer/Em andamento ou concluir), guardamos
-- aqui os responsáveis de antes. Vazio fora da revisão.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.tasks
  add column if not exists review_from uuid[] not null default '{}';
