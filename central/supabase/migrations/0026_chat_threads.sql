-- ============================================================================
-- Central Anju — Chat: respostas em thread (estilo Slack)
-- ----------------------------------------------------------------------------
-- Uma resposta é uma mensagem comum que aponta para a mensagem-pai via
-- parent_id. Mensagens de topo (parent_id null) aparecem no canal; respostas
-- ficam agrupadas na thread do pai. ON DELETE CASCADE: apagar o pai apaga as
-- respostas. As policies/Realtime de chat_messages já cobrem as respostas (são
-- linhas da mesma tabela, no mesmo canal).
--
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.chat_messages
  add column if not exists parent_id uuid references public.chat_messages(id) on delete cascade;

create index if not exists chat_messages_parent_idx
  on public.chat_messages (parent_id, created_at);
