-- ============================================================================
-- Central Anju — Chat da equipe (Fase 1: canais + mensagens + realtime)
-- ----------------------------------------------------------------------------
-- Três tabelas: chat_channels (canais e, no futuro, DMs), chat_members
-- (quem está em cada canal + marcação de leitura) e chat_messages (as
-- mensagens). A entrega ao vivo é via Supabase Realtime, no mesmo padrão de
-- comments/notifications.
--
-- Visibilidade: canais públicos (is_private=false) são visíveis a todos os
-- autenticados — qualquer um lê e escreve. Canais/DMs privados só aos membros.
-- As checagens ficam em funções SECURITY DEFINER (is_chat_member /
-- can_read_channel) para evitar recursão de RLS ao consultar a própria tabela.
--
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabelas
-- ----------------------------------------------------------------------------
create table if not exists public.chat_channels (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'channel' check (kind in ('channel','dm')),
  name        text not null,
  description text,
  is_private  boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.chat_members (
  channel_id   uuid not null references public.chat_channels(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('member','admin')),
  last_read_at timestamptz not null default now(),
  joined_at    timestamptz not null default now(),
  primary key (channel_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references public.chat_channels(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body        text not null,
  edited_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists chat_messages_channel_idx
  on public.chat_messages (channel_id, created_at);

-- REPLICA IDENTITY FULL: faz o Realtime entregar o channel_id nos eventos de
-- UPDATE/DELETE (sob a identidade padrão só viria a PK), permitindo filtrar a
-- subscription por canal e remover/editar a mensagem certa em todos os clientes.
alter table public.chat_messages replica identity full;

-- ----------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER — ignoram RLS, evitando recursão nas policies)
-- ----------------------------------------------------------------------------
create or replace function public.is_chat_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_members m
    where m.channel_id = cid and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_read_channel(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_channels c
    where c.id = cid and (c.is_private = false or public.is_chat_member(cid))
  );
$$;

grant execute on function public.is_chat_member(uuid) to authenticated, service_role;
grant execute on function public.can_read_channel(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.chat_channels enable row level security;
alter table public.chat_members  enable row level security;
alter table public.chat_messages enable row level security;

-- Canais: públicos visíveis a todos; privados só a membros.
drop policy if exists chat_channels_select on public.chat_channels;
create policy chat_channels_select on public.chat_channels for select to authenticated
  using (is_private = false or public.is_chat_member(id));

-- Cria como si mesmo (created_by = quem está logado).
drop policy if exists chat_channels_insert on public.chat_channels;
create policy chat_channels_insert on public.chat_channels for insert to authenticated
  with check (created_by = auth.uid());

-- Edita/exclui quem criou; gestores (manage_users) moderam qualquer um.
drop policy if exists chat_channels_update on public.chat_channels;
create policy chat_channels_update on public.chat_channels for update to authenticated
  using (created_by = auth.uid() or public.can('manage_users'))
  with check (created_by = auth.uid() or public.can('manage_users'));

drop policy if exists chat_channels_delete on public.chat_channels;
create policy chat_channels_delete on public.chat_channels for delete to authenticated
  using (created_by = auth.uid() or public.can('manage_users'));

-- Membros: vê os co-membros dos canais em que está; gestores veem todos.
drop policy if exists chat_members_select on public.chat_members;
create policy chat_members_select on public.chat_members for select to authenticated
  using (user_id = auth.uid() or public.is_chat_member(channel_id) or public.can('manage_users'));

-- Entra como si mesmo (auto-join de canal público); gestores adicionam outros.
drop policy if exists chat_members_insert on public.chat_members;
create policy chat_members_insert on public.chat_members for insert to authenticated
  with check (user_id = auth.uid() or public.can('manage_users'));

-- Atualiza só a própria associação (ex.: last_read_at).
drop policy if exists chat_members_update_own on public.chat_members;
create policy chat_members_update_own on public.chat_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Sai do canal (remove a si mesmo); gestores removem qualquer um.
drop policy if exists chat_members_delete on public.chat_members;
create policy chat_members_delete on public.chat_members for delete to authenticated
  using (user_id = auth.uid() or public.can('manage_users'));

-- Mensagens: lê quem pode ler o canal.
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages for select to authenticated
  using (public.can_read_channel(channel_id));

-- Escreve como si mesmo, num canal que pode ler.
drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages for insert to authenticated
  with check (author_id = auth.uid() and public.can_read_channel(channel_id));

-- Edita a própria mensagem.
drop policy if exists chat_messages_update_own on public.chat_messages;
create policy chat_messages_update_own on public.chat_messages for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Apaga a própria; gestores (manage_users) moderam qualquer uma.
drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete on public.chat_messages for delete to authenticated
  using (author_id = auth.uid() or public.can('manage_users'));

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.chat_channels to authenticated, service_role;
grant select, insert, update, delete on public.chat_members  to authenticated, service_role;
grant select, insert, update, delete on public.chat_messages to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Realtime (entrega ao vivo — idempotente)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_channels'
  ) then
    alter publication supabase_realtime add table public.chat_channels;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed: canal #geral (para a aba não nascer vazia). created_by fica nulo —
-- a migration roda como dono e ignora a RLS de insert.
-- ----------------------------------------------------------------------------
insert into public.chat_channels (kind, name, description, is_private)
select 'channel', 'geral', 'Canal geral da equipe Anju', false
where not exists (
  select 1 from public.chat_channels where kind = 'channel' and lower(name) = 'geral'
);
