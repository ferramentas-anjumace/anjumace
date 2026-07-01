-- ============================================================================
-- Central Anju — Chat Fase 2: mensagens diretas (DM) + não-lidas
-- ----------------------------------------------------------------------------
-- Tudo via funções (SECURITY DEFINER) para encapsular regras e ignorar a RLS
-- onde precisamos (criar DM, semear associação de canal público). As tabelas
-- já existem desde a 0022.
--
--   get_or_create_dm(other)      -> id do canal de DM entre o usuário e `other`
--                                   (cria + associa os dois se ainda não existir)
--   chat_ensure_memberships()    -> garante uma linha em chat_members do usuário
--                                   para cada canal público (baseline de leitura)
--   chat_mark_read(cid)          -> marca o canal como lido agora (upsert)
--   chat_unread_counts()         -> (channel_id, unread) do usuário, por canal
--
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Encontra (ou cria) a DM 1-a-1 entre o usuário atual e `other`.
-- DM = canal kind='dm', privado, com exatamente os dois como membros.
-- ----------------------------------------------------------------------------
create or replace function public.get_or_create_dm(other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me  uuid := auth.uid();
  cid uuid;
begin
  if other is null or other = me then
    raise exception 'destinatário de DM inválido';
  end if;

  -- DM existente: canal dm que tem os dois e só os dois.
  select c.id into cid
  from public.chat_channels c
  where c.kind = 'dm'
    and exists (select 1 from public.chat_members m where m.channel_id = c.id and m.user_id = me)
    and exists (select 1 from public.chat_members m where m.channel_id = c.id and m.user_id = other)
    and (select count(*) from public.chat_members m where m.channel_id = c.id) = 2
  limit 1;

  if cid is not null then
    return cid;
  end if;

  insert into public.chat_channels (kind, name, is_private, created_by)
  values ('dm', '', true, me)
  returning id into cid;

  insert into public.chat_members (channel_id, user_id) values (cid, me), (cid, other);

  return cid;
end $$;

-- ----------------------------------------------------------------------------
-- Garante associação do usuário a todos os canais públicos (baseline de leitura
-- = now()). Sem isso, canal nunca aberto não teria last_read_at para comparar.
-- ----------------------------------------------------------------------------
create or replace function public.chat_ensure_memberships()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.chat_members (channel_id, user_id)
  select c.id, auth.uid()
  from public.chat_channels c
  where c.kind = 'channel' and c.is_private = false
    and not exists (
      select 1 from public.chat_members m
      where m.channel_id = c.id and m.user_id = auth.uid()
    );
$$;

-- ----------------------------------------------------------------------------
-- Marca um canal como lido agora (cria a associação se faltar — auto-join de
-- canal público).
-- ----------------------------------------------------------------------------
create or replace function public.chat_mark_read(cid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.chat_members (channel_id, user_id, last_read_at)
  values (cid, auth.uid(), now())
  on conflict (channel_id, user_id) do update set last_read_at = now();
end $$;

-- ----------------------------------------------------------------------------
-- Conta não-lidas por canal do usuário: mensagens após last_read_at que não
-- foram escritas por ele. Canais sem mensagem nova vêm com 0.
-- ----------------------------------------------------------------------------
create or replace function public.chat_unread_counts()
returns table (channel_id uuid, unread bigint)
language sql
stable
security definer
set search_path = public
as $$
  select m.channel_id, count(msg.id) as unread
  from public.chat_members m
  left join public.chat_messages msg
    on msg.channel_id = m.channel_id
   and msg.created_at > m.last_read_at
   and msg.author_id <> m.user_id
  where m.user_id = auth.uid()
  group by m.channel_id;
$$;

grant execute on function public.get_or_create_dm(uuid)    to authenticated, service_role;
grant execute on function public.chat_ensure_memberships() to authenticated, service_role;
grant execute on function public.chat_mark_read(uuid)      to authenticated, service_role;
grant execute on function public.chat_unread_counts()      to authenticated, service_role;
