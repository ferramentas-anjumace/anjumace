-- ============================================================================
-- Central Anju — novo papel "Social Media" + capacidade `manage_social`
-- ----------------------------------------------------------------------------
-- Mesmo racional do papel Comercial: o pessoal de social media compartilha o
-- papel "Time" e não conseguia editar o Calendário de Conteúdos sem receber o
-- pacote inteiro de `manage_resources` (credenciais, agenda, catálogos).
--
-- Cria a capacidade `manage_social` (editar o Editorial e, no futuro, a aba de
-- métricas do Instagram) e move a ESCRITA do editorial de `manage_resources`
-- para `manage_social`. A LEITURA do editorial continua aberta a todos.
-- Decisão da equipe:
--   • Editorial passa a ser editável por Social Media + gestores (Admin/Liderança);
--     Time e Comercial só visualizam.
--   • Social Media NÃO é gestor (não exclui usuários; não acessa credenciais).
--   • A futura aba de analytics do Instagram ficará sob `manage_social`.
--
-- Depende da 0029/0030. Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- Nova capacidade na matriz ----------------------------------------------
alter table public.role_permissions
  add column if not exists manage_social boolean not null default false;

-- Gestores mantêm a edição do editorial (que antes vinha de manage_resources).
update public.role_permissions set manage_social = true where role in ('admin','lideranca');

-- ---- Permite o papel 'social' nas tabelas que restringem o valor -------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','lideranca','comercial','social','time'));

alter table public.role_permissions drop constraint if exists role_permissions_role_check;
alter table public.role_permissions add constraint role_permissions_role_check
  check (role in ('admin','lideranca','comercial','social','time'));

-- ---- Linha do papel Social Media na matriz ----------------------------------
-- Executa/mover tarefas como o Time, porém com o Editorial/Social ligado.
insert into public.role_permissions
  (role, create_task, move_task, manage_users, manage_resources, manage_crm, manage_social) values
  ('social', false, true, false, false, false, true)
on conflict (role) do nothing;

-- ---- Atualiza o helper can() com todas as capacidades atuais -----------------
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
         when 'manage_crm'       then manage_crm
         when 'manage_social'    then manage_social
         else false
       end
       from public.role_permissions
       where role = (select role from public.profiles where id = auth.uid())),
      false)
  end;
$$;

-- ---- Escrita do editorial passa a exigir manage_social ----------------------
-- (a leitura continua aberta: editorial_select using(true))
drop policy if exists editorial_write on public.editorial_posts;
create policy editorial_write on public.editorial_posts for all to authenticated
  using (public.can('manage_social')) with check (public.can('manage_social'));
