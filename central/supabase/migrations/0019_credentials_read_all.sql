-- ============================================================================
-- Central Anju — senhas das plataformas visíveis para todo o time
-- ----------------------------------------------------------------------------
-- O time também acessa as plataformas, então precisa LER as credenciais. Antes
-- a política era `cred_admin_all` (FOR ALL com manage_resources), o que bloqueava
-- a leitura para quem não gere recursos. Agora: leitura para todo autenticado;
-- criar/editar/excluir continua restrito a quem tem manage_resources.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

drop policy if exists cred_admin_all on public.client_credentials;

drop policy if exists cred_select on public.client_credentials;
create policy cred_select on public.client_credentials for select to authenticated
  using (true);

drop policy if exists cred_insert on public.client_credentials;
create policy cred_insert on public.client_credentials for insert to authenticated
  with check (public.can('manage_resources'));

drop policy if exists cred_update on public.client_credentials;
create policy cred_update on public.client_credentials for update to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists cred_delete on public.client_credentials;
create policy cred_delete on public.client_credentials for delete to authenticated
  using (public.can('manage_resources'));
