-- ============================================================================
-- Central Anju — correção da limpeza de anexos ao excluir a entidade
-- ----------------------------------------------------------------------------
-- A versão anterior (0013) deletava direto de storage.objects dentro do gatilho.
-- O Supabase BLOQUEIA DELETE direto nessa tabela:
--   "Direct deletion from storage tables is not allowed. Use the Storage API."
-- Como o gatilho roda na MESMA transação do delete da tarefa/post, o erro
-- abortava tudo e a entidade NUNCA era excluída.
--
-- Correção: o gatilho passa a remover SÓ os metadados (public.attachments). Os
-- ARQUIVOS no Storage são removidos pelo client (Storage API) ANTES de excluir
-- a entidade. Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create or replace function public.cleanup_attachments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Apenas metadados. Os objetos no Storage são limpos pelo client (Storage API).
  delete from public.attachments
   where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end $$;

-- Os gatilhos cleanup_task_attachments / cleanup_editorial_attachments (0013) já
-- apontam para esta função — não precisam ser recriados.
