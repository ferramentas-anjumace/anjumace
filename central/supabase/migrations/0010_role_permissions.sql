-- ============================================================================
-- Central Anju — controle de permissões por papel (matriz configurável)
-- ----------------------------------------------------------------------------
-- Gestores controlam o que cada papel pode fazer. As capacidades:
--   create_task       — criar tarefas
--   move_task         — mover/concluir tarefas
--   manage_users      — criar/excluir pessoas e trocar papéis
--   manage_resources  — gerir acessos, agenda, editorial, conteúdo, clientes
-- Admin tem SEMPRE tudo (a função can() força true para admin).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.role_permissions (
  role             text primary key check (role in ('admin','lideranca','time')),
  create_task      boolean not null default false,
  move_task        boolean not null default true,
  manage_users     boolean not null default false,
  manage_resources boolean not null default false
);

-- Defaults: admin e liderança gerem tudo; Time executa e move.
insert into public.role_permissions (role, create_task, move_task, manage_users, manage_resources) values
  ('admin',     true,  true,  true,  true),
  ('lideranca', true,  true,  true,  true),
  ('time',      false, true,  false, false)
on conflict (role) do nothing;

-- A linha do admin é sempre "tudo true" (defensivo, mesmo que editem por engano).
update public.role_permissions
  set create_task = true, move_task = true, manage_users = true, manage_resources = true
  where role = 'admin';

-- ----------------------------------------------------------------------------
-- Helper: a pessoa logada tem a capacidade `cap`? (admin sempre true)
-- ----------------------------------------------------------------------------
create or replace function public.can(cap text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when (select role from public.profiles where id = auth.uid()) = 'admin' then true
    else coalesce(
      (select case cap
         when 'create_task'      then create_task
         when 'move_task'        then move_task
         when 'manage_users'     then manage_users
         when 'manage_resources' then manage_resources
         else false
       end
       from public.role_permissions
       where role = (select role from public.profiles where id = auth.uid())),
      false)
  end;
$$;

-- ----------------------------------------------------------------------------
-- RLS da própria tabela: todos leem; só quem gere usuários edita a matriz.
-- ----------------------------------------------------------------------------
alter table public.role_permissions enable row level security;

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions for select to authenticated
  using (true);

drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions for all to authenticated
  using (public.can('manage_users')) with check (public.can('manage_users'));

grant select, insert, update, delete on public.role_permissions to authenticated;
grant select, insert, update, delete on public.role_permissions to service_role;

-- ----------------------------------------------------------------------------
-- Reescreve as policies de escrita para usar as capacidades.
-- ----------------------------------------------------------------------------

-- TAREFAS: criar/excluir = create_task; mover/atualizar = move_task.
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.can('create_task'));

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
  using (public.can('move_task')) with check (public.can('move_task'));

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.can('create_task'));

-- USUÁRIOS (profiles): gestão = manage_users (o self-update continua valendo).
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.can('manage_users')) with check (public.can('manage_users'));

-- RECURSOS: clientes, mídia, credenciais e agenda = manage_resources.
drop policy if exists clients_admin_write on public.clients;
create policy clients_admin_write on public.clients for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists media_admin_write on public.client_media;
create policy media_admin_write on public.client_media for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists cred_admin_all on public.client_credentials;
create policy cred_admin_all on public.client_credentials for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists agenda_admin_write on public.agenda_events;
create policy agenda_admin_write on public.agenda_events for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

-- Entrega ao vivo das mudanças da matriz (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'role_permissions'
  ) then
    alter publication supabase_realtime add table public.role_permissions;
  end if;
end $$;
