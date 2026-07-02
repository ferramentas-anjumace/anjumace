-- ============================================================================
-- Central Anju — CRM visível para todos (só-leitura); edição segue gated
-- ----------------------------------------------------------------------------
-- Princípio de permissões da Central: todo papel ENXERGA todas as seções e o
-- conteúdo delas; só quem tem a capacidade EDITA. A 0029 tinha restringido a
-- LEITURA do CRM a `manage_crm` — aqui reabrimos a leitura para todos os
-- autenticados. A escrita (insert/update) continua exigindo `manage_crm` e a
-- exclusão de leads segue só para gestores (manage_users).
--
-- Idempotente. Rode inteiro no SQL Editor → Run (depende da 0029).
-- ============================================================================

-- Leads: leitura aberta a todos (edição inalterada).
drop policy if exists crm_leads_select on public.crm_leads;
create policy crm_leads_select on public.crm_leads for select to authenticated
  using (true);

-- Interações: leitura aberta a todos (escrita inalterada).
drop policy if exists crm_interactions_select on public.crm_interactions;
create policy crm_interactions_select on public.crm_interactions for select to authenticated
  using (true);
