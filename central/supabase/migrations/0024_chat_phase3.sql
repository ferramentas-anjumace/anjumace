-- ============================================================================
-- Central Anju — Chat Fase 3: anexos + menções @ + reações
-- ----------------------------------------------------------------------------
-- Reaproveita a infra existente:
--   • attachments  -> estende o check para aceitar entity_type='chat_message'
--                     e limpa anexos+objetos quando a mensagem é excluída.
--   • notifications-> ganha chat_channel_id para o sino linkar direto na
--                     conversa onde a pessoa foi mencionada.
-- E cria a tabela nova de reações (emoji por mensagem).
--
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Anexos de mensagens de chat (reusa o bucket/tabela 'attachments' da 0013)
-- ----------------------------------------------------------------------------
alter table public.attachments drop constraint if exists attachments_entity_type_check;
alter table public.attachments
  add constraint attachments_entity_type_check
  check (entity_type in ('task', 'editorial', 'chat_message'));

-- Limpa metadados + objetos no Storage quando a mensagem some.
drop trigger if exists cleanup_chat_message_attachments on public.chat_messages;
create trigger cleanup_chat_message_attachments
  after delete on public.chat_messages
  for each row execute function public.cleanup_attachments('chat_message');

-- ----------------------------------------------------------------------------
-- Notificações de menção: deep-link para o canal
-- ----------------------------------------------------------------------------
alter table public.notifications
  add column if not exists chat_channel_id uuid references public.chat_channels(id) on delete cascade;

-- ----------------------------------------------------------------------------
-- Reações (emoji por mensagem). channel_id é denormalizado para a RLS poder
-- usar can_read_channel sem join.
-- ----------------------------------------------------------------------------
create table if not exists public.chat_reactions (
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
create index if not exists chat_reactions_message_idx on public.chat_reactions (message_id);
create index if not exists chat_reactions_channel_idx on public.chat_reactions (channel_id);

-- Entrega o channel_id/emoji nos eventos de DELETE do Realtime.
alter table public.chat_reactions replica identity full;

alter table public.chat_reactions enable row level security;

-- Lê quem pode ler o canal.
drop policy if exists chat_reactions_select on public.chat_reactions;
create policy chat_reactions_select on public.chat_reactions for select to authenticated
  using (public.can_read_channel(channel_id));

-- Reage como si mesmo, num canal que pode ler.
drop policy if exists chat_reactions_insert on public.chat_reactions;
create policy chat_reactions_insert on public.chat_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.can_read_channel(channel_id));

-- Remove a própria reação.
drop policy if exists chat_reactions_delete on public.chat_reactions;
create policy chat_reactions_delete on public.chat_reactions for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.chat_reactions to authenticated, service_role;

-- Realtime (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_reactions'
  ) then
    alter publication supabase_realtime add table public.chat_reactions;
  end if;
end $$;
