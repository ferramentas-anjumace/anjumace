-- ============================================================================
-- Central Anju — separa "catálogos" de "acessos e agenda" (capacidade nova)
-- ----------------------------------------------------------------------------
-- Até aqui, `manage_resources` cobria acessos (credenciais), agenda E catálogos
-- num pacote só. O papel Social Media precisa gerir os CATÁLOGOS (formatos do
-- editorial, dropdowns…) sem receber acesso a credenciais/agenda.
--
-- Cria a capacidade `manage_catalogs` (só as listas editáveis / catalog_items)
-- e move a escrita dos catálogos de `manage_resources` → `manage_catalogs`.
-- `manage_resources` continua valendo para acessos, agenda, clientes e mídia.
--
-- Defaults: Admin/Liderança mantêm (ganham manage_catalogs); Social Media passa
-- a ter manage_catalogs; Comercial e Time seguem sem.
--
-- Depende da 0029/0030/0031. Aditivo e idempotente. Rode no SQL Editor → Run.
-- ============================================================================

-- ---- Nova capacidade na matriz ----------------------------------------------
alter table public.role_permissions
  add column if not exists manage_catalogs boolean not null default false;

-- Gestores mantêm a gestão de catálogos (que antes vinha de manage_resources);
-- Social Media passa a poder gerir catálogos.
update public.role_permissions set manage_catalogs = true
  where role in ('admin','lideranca','social');

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
         when 'manage_catalogs'  then manage_catalogs
         when 'manage_crm'       then manage_crm
         when 'manage_social'    then manage_social
         else false
       end
       from public.role_permissions
       where role = (select role from public.profiles where id = auth.uid())),
      false)
  end;
$$;

-- ---- Escrita dos catálogos passa a exigir manage_catalogs -------------------
-- (a leitura continua aberta: catalog_select using(true))
drop policy if exists catalog_write on public.catalog_items;
create policy catalog_write on public.catalog_items for all to authenticated
  using (public.can('manage_catalogs')) with check (public.can('manage_catalogs'));
