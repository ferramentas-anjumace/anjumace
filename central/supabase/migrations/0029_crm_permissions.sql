-- ============================================================================
-- Central Anju — permissão dedicada do CRM (capacidade `manage_crm`)
-- ----------------------------------------------------------------------------
-- Transforma o CRM numa seção permissionada de verdade. Nova capacidade na
-- matriz papel × capacidade:
--   manage_crm — ver e editar o CRM (leads, pipeline, histórico de interações)
--
-- Decisão da equipe: Time COM acesso por padrão (todos usam); o gestor pode
-- DESLIGAR depois na tela de Permissões. Admin sempre tem (forçado no can()).
-- A EXCLUSÃO de leads continua restrita a gestores (manage_users).
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- Coluna nova na matriz (default true = Time com acesso) ------------------
alter table public.role_permissions
  add column if not exists manage_crm boolean not null default true;

-- Garante as três linhas existentes com acesso (idempotente).
update public.role_permissions set manage_crm = true
  where role in ('admin','lideranca','time') and manage_crm is distinct from true;

-- ---- Atualiza o helper can() para reconhecer a nova capacidade ---------------
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
         else false
       end
       from public.role_permissions
       where role = (select role from public.profiles where id = auth.uid())),
      false)
  end;
$$;

-- ---- Reescreve o RLS do CRM para exigir a capacidade ------------------------
-- Leads: ver/criar/editar = manage_crm; excluir = manage_users (gestor).
drop policy if exists crm_leads_select on public.crm_leads;
create policy crm_leads_select on public.crm_leads for select to authenticated
  using (public.can('manage_crm'));

drop policy if exists crm_leads_insert on public.crm_leads;
create policy crm_leads_insert on public.crm_leads for insert to authenticated
  with check (public.can('manage_crm'));

drop policy if exists crm_leads_update on public.crm_leads;
create policy crm_leads_update on public.crm_leads for update to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

-- (crm_leads_delete permanece como está: public.can('manage_users'))

-- Interações: ver/escrever = manage_crm.
drop policy if exists crm_interactions_select on public.crm_interactions;
create policy crm_interactions_select on public.crm_interactions for select to authenticated
  using (public.can('manage_crm'));

drop policy if exists crm_interactions_write on public.crm_interactions;
create policy crm_interactions_write on public.crm_interactions for all to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));
