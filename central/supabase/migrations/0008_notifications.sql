-- ============================================================================
-- Central Anju — notificações in-app
-- ----------------------------------------------------------------------------
-- Usada pela automação de tarefas: ao enviar uma tarefa para revisão, os
-- gestores (admin/liderança) recebem uma notificação. Cada pessoa só lê e
-- marca como lidas as PRÓPRIAS; qualquer autenticado pode INSERIR (para poder
-- notificar terceiros). Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  task_id    uuid references public.tasks(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

-- Cada um lê as próprias.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- Cada um marca as próprias como lidas (e só pode mexer nas próprias).
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cada um exclui as próprias (limpar a caixa).
drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- Qualquer autenticado pode criar (a automação notifica os revisores).
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert to authenticated
  with check (true);

-- Privilégios de tabela (a 0002/0003 já cobrem por default privileges, mas
-- garantimos explicitamente para tabelas criadas fora daquele fluxo).
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

-- Habilita Realtime para entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
