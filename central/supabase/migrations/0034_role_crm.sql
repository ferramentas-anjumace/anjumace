-- ============================================================================
-- Central Anju — novo papel "CRM" (operação da base / disparos)
-- ----------------------------------------------------------------------------
-- Separa duas funções que usam o CRM: o "Comercial" (relacionamento 1:1 com os
-- leads) e o "CRM" (quem gerencia a base e faz os disparos de e-mail). Por ora
-- os dois têm o MESMO acesso ao CRM (manage_crm) — a diferença é organizacional.
-- Quando existir o recurso de disparo de e-mail, ele pode ser gated para este
-- papel. Exclusão de leads continua só para gestores.
--
-- Papel CRM = mesmas capacidades do Comercial (mover tarefas + manage_crm).
-- Depende da 0029→0033. Idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- Permite o papel 'crm' nas tabelas que restringem o valor ----------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','lideranca','comercial','social','design','crm'));

alter table public.role_permissions drop constraint if exists role_permissions_role_check;
alter table public.role_permissions add constraint role_permissions_role_check
  check (role in ('admin','lideranca','comercial','social','design','crm'));

-- ---- Linha do papel CRM na matriz (igual ao Comercial) ----------------------
insert into public.role_permissions
  (role, create_task, move_task, manage_users, manage_resources, manage_catalogs, manage_crm, manage_social) values
  ('crm', false, true, false, false, false, true, false)
on conflict (role) do nothing;
