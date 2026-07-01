-- ============================================================================
-- Central Anju — Chat: quem pode excluir mensagem
-- ----------------------------------------------------------------------------
-- Regra: cada pessoa só exclui a PRÓPRIA mensagem. A exceção são os gestores
-- (Administrador e Liderança), que moderam qualquer uma.
--
-- Antes a policy usava can('manage_users') — uma capacidade CONFIGURÁVEL na
-- matriz de permissões (poderia ser concedida ao papel "Time" por engano).
-- Trocamos para public.is_admin(), que é estritamente o papel admin/liderança
-- (ver migration 0007), garantindo a regra independentemente da matriz.
--
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete on public.chat_messages for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());
