-- ----------------------------------------------------------------------------
-- 0045 · Chat: participantes podem excluir as próprias DMs
-- ----------------------------------------------------------------------------
-- A policy de delete de chat_channels cobria só criador/gestor. Como a DM é
-- criada por quem abriu a conversa primeiro (get_or_create_dm), o outro
-- participante não conseguia excluir. Regra nova:
--   - canal comum: criador ou gestor (como antes);
--   - DM: qualquer um dos dois participantes (is_chat_member).
-- A exclusão apaga o canal para os dois lados (mensagens/membros/reações caem
-- em cascata; anexos são limpos pelo trigger de chat_messages).

drop policy if exists chat_channels_delete on public.chat_channels;
create policy chat_channels_delete on public.chat_channels for delete to authenticated
  using (
    created_by = auth.uid()
    or public.can('manage_users')
    or (kind = 'dm' and public.is_chat_member(id))
  );
