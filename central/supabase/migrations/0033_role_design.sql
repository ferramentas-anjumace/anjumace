-- ============================================================================
-- Central Anju — aposenta o papel "Time" e cria o papel "Design"
-- ----------------------------------------------------------------------------
-- O papel genérico "Time" está sendo descontinuado: cada pessoa passa a ter um
-- papel específico (Admin, Liderança, Comercial, Social Media, Design). O único
-- usuário que estava em "Time" (o designer) vai para o novo papel "Design".
--
-- "Design" é a base de MENOR privilégio (só mover tarefas) — ajustável depois na
-- tela de Permissões. Vira também o fallback técnico de login sem papel definido.
--
-- Depende da 0029→0032. Idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- Solta os CHECKs para permitir a transição ------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.role_permissions drop constraint if exists role_permissions_role_check;

-- ---- Cria o papel Design na matriz (base mínima: só mover tarefas) -----------
insert into public.role_permissions
  (role, create_task, move_task, manage_users, manage_resources, manage_catalogs, manage_crm, manage_social) values
  ('design', false, true, false, false, false, false, false)
on conflict (role) do nothing;

-- ---- Migra quem está em 'time' → 'design' -----------------------------------
update public.profiles set role = 'design' where role = 'time';

-- ---- Remove o papel 'time' da matriz ----------------------------------------
delete from public.role_permissions where role = 'time';

-- ---- Reaplica os CHECKs já sem 'time' ---------------------------------------
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','lideranca','comercial','social','design'));
alter table public.role_permissions add constraint role_permissions_role_check
  check (role in ('admin','lideranca','comercial','social','design'));
