-- ============================================================================
-- Central Anju — comentários / discussão (polimórfico)
-- ----------------------------------------------------------------------------
-- Uma só tabela serve tarefas e editorial (e o que vier): a referência é
-- (entity_type, entity_id). Todos leem e comentam; cada um edita/apaga o
-- próprio comentário; gestores (can manage_users) moderam qualquer um.
-- Gatilhos limpam os comentários quando a tarefa/post é excluída.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('task','editorial')),
  entity_id   uuid not null,
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_entity_idx
  on public.comments (entity_type, entity_id, created_at);

alter table public.comments enable row level security;

-- Todos os autenticados leem.
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select to authenticated
  using (true);

-- Só cria como si mesmo (author_id = quem está logado).
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid());

-- Edita o próprio comentário.
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Apaga o próprio; gestores (manage_users) moderam qualquer um.
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.can('manage_users'));

grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.comments to service_role;

-- ----------------------------------------------------------------------------
-- Limpeza: ao excluir a entidade, remove os comentários órfãos. (Referência
-- polimórfica não tem FK, então cuidamos por gatilho.)
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.comments
   where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end $$;

drop trigger if exists cleanup_task_comments on public.tasks;
create trigger cleanup_task_comments
  after delete on public.tasks
  for each row execute function public.cleanup_comments('task');

drop trigger if exists cleanup_editorial_comments on public.editorial_posts;
create trigger cleanup_editorial_comments
  after delete on public.editorial_posts
  for each row execute function public.cleanup_comments('editorial');

-- Entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;
