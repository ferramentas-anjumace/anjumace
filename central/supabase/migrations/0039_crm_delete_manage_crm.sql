-- ============================================================================
-- CRM — permitir que o Comercial exclua leads
-- ----------------------------------------------------------------------------
-- Antes: excluir lead exigia public.can('manage_users') (só Admin/Liderança),
-- para proteger a base contra perda acidental.
-- Agora (pedido da equipe): qualquer papel com `manage_crm` pode excluir —
-- ou seja, Comercial e CRM, além de Admin/Liderança.
-- Aditivo e idempotente. Rode no SQL Editor → Run.
-- ============================================================================

drop policy if exists crm_leads_delete on public.crm_leads;
create policy crm_leads_delete on public.crm_leads for delete to authenticated
  using (public.can('manage_crm'));
