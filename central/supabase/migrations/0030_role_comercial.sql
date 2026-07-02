-- ============================================================================
-- Central Anju — novo papel "Comercial" (dedicado ao CRM)
-- ----------------------------------------------------------------------------
-- O modelo de permissões é por PAPEL. Como o time comercial (Keila, Gabriel…)
-- compartilha o papel "Time" com o resto, não dava para liberar o CRM só para
-- eles. Este papel resolve isso: "Comercial" executa tarefas como o Time, mas
-- COM acesso ao CRM. Decisão da equipe:
--   • CRM passa a ser exclusivo de Comercial + gestores (Admin/Liderança);
--     o papel "Time" perde o acesso ao CRM.
--   • Exclusão de leads continua só para gestores (manage_users) — o Comercial
--     usa o status "Inativo" para arquivar.
--   • Comercial NÃO é gestor (não entra no is_manager; não exclui leads/usuários).
--
-- Depende da 0029 (coluna manage_crm). Aditivo e idempotente.
-- Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- Permite o papel 'comercial' nas tabelas que restringem o valor ---------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','lideranca','comercial','time'));

alter table public.role_permissions drop constraint if exists role_permissions_role_check;
alter table public.role_permissions add constraint role_permissions_role_check
  check (role in ('admin','lideranca','comercial','time'));

-- ---- Linha do papel Comercial na matriz -------------------------------------
-- Executa/mover tarefas como o Time, porém com o CRM ligado.
insert into public.role_permissions
  (role, create_task, move_task, manage_users, manage_resources, manage_crm) values
  ('comercial', false, true, false, false, true)
on conflict (role) do nothing;

-- ---- CRM deixa de ser padrão do Time (exclusivo de Comercial + gestores) -----
update public.role_permissions set manage_crm = false where role = 'time';
