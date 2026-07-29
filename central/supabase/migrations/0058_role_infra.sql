-- ============================================================================
-- Central Anju — novo papel "Infra" (infraestrutura/técnico)
-- ----------------------------------------------------------------------------
-- Papel de base mínima (só mover tarefas), igual ao Design — ajustável depois
-- em Permissões (/app/config) sem precisar de nova migration.
--
-- Depende da 0034_role_crm. Idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- Permite o papel 'infra' nas tabelas que restringem o valor -------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','lideranca','comercial','social','design','crm','infra'));

alter table public.role_permissions drop constraint if exists role_permissions_role_check;
alter table public.role_permissions add constraint role_permissions_role_check
  check (role in ('admin','lideranca','comercial','social','design','crm','infra'));

-- ---- Linha do papel Infra na matriz (base mínima, igual ao Design) ----------
insert into public.role_permissions
  (role, create_task, move_task, manage_users, manage_resources, manage_catalogs, manage_crm, manage_social) values
  ('infra', false, true, false, false, false, false, false)
on conflict (role) do nothing;
