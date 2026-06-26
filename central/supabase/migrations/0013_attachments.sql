-- ============================================================================
-- Central Anju — anexos / arquivos (Supabase Storage + metadados)
-- ----------------------------------------------------------------------------
-- Cria o bucket PRIVADO "attachments" (download por signed URL) e uma tabela
-- polimórfica de metadados que serve tarefas e editorial — referência por
-- (entity_type, entity_id), no mesmo padrão dos comentários. Os arquivos vão
-- para storage.objects; aqui guardamos nome, tipo, tamanho e quem enviou.
-- Gatilhos limpam metadados E objetos quando a entidade é excluída.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------- BUCKET -----
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400)  -- 25 MB por arquivo
on conflict (id) do nothing;

-- Políticas do Storage para o bucket (time logado lê/sobe/remove; o controle
-- fino de quem pode remover fica na tabela de metadados abaixo).
drop policy if exists attachments_obj_read on storage.objects;
create policy attachments_obj_read on storage.objects for select to authenticated
  using (bucket_id = 'attachments');

drop policy if exists attachments_obj_insert on storage.objects;
create policy attachments_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');

drop policy if exists attachments_obj_delete on storage.objects;
create policy attachments_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'attachments');

-- ------------------------------------------------------------ METADADOS ------
create table if not exists public.attachments (
  id               uuid primary key default gen_random_uuid(),
  entity_type      text not null check (entity_type in ('task','editorial')),
  entity_id        uuid not null,
  bucket           text not null default 'attachments',
  path             text not null,        -- caminho do objeto no Storage
  name             text not null,        -- nome original do arquivo
  mime             text,
  size             bigint,
  uploaded_by      uuid references auth.users(id) on delete set null,
  uploaded_by_name text not null,
  created_at       timestamptz not null default now()
);

create index if not exists attachments_entity_idx
  on public.attachments (entity_type, entity_id, created_at);

alter table public.attachments enable row level security;

-- Todos os autenticados leem (e baixam).
drop policy if exists attachments_select on public.attachments;
create policy attachments_select on public.attachments for select to authenticated
  using (true);

-- Só registra como si mesmo.
drop policy if exists attachments_insert on public.attachments;
create policy attachments_insert on public.attachments for insert to authenticated
  with check (uploaded_by = auth.uid());

-- Remove o próprio; gestores (manage_users) moderam qualquer um.
drop policy if exists attachments_delete on public.attachments;
create policy attachments_delete on public.attachments for delete to authenticated
  using (uploaded_by = auth.uid() or public.can('manage_users'));

grant select, insert, update, delete on public.attachments to authenticated;
grant select, insert, update, delete on public.attachments to service_role;

-- ----------------------------------------------------------------------------
-- Limpeza: ao excluir a entidade, remove metadados E os objetos no Storage.
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_attachments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects o
   using public.attachments a
   where a.entity_type = tg_argv[0] and a.entity_id = old.id
     and o.bucket_id = a.bucket and o.name = a.path;
  delete from public.attachments
   where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end $$;

drop trigger if exists cleanup_task_attachments on public.tasks;
create trigger cleanup_task_attachments
  after delete on public.tasks
  for each row execute function public.cleanup_attachments('task');

drop trigger if exists cleanup_editorial_attachments on public.editorial_posts;
create trigger cleanup_editorial_attachments
  after delete on public.editorial_posts
  for each row execute function public.cleanup_attachments('editorial');

-- Entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'attachments'
  ) then
    alter publication supabase_realtime add table public.attachments;
  end if;
end $$;
