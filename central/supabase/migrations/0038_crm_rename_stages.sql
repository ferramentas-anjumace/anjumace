-- ============================================================================
-- CRM — renomear etapas do pipeline (pedido pós-checkpoint)
-- ----------------------------------------------------------------------------
--   "Aguardando resposta"   → "Negociação"   (sort 3)
--   "Proposta / Negociação" → "Fechamento"   (sort 4)
--
-- O status do lead é guardado pelo TEXTO (crm_leads.status), então renomeamos
-- o catálogo E atualizamos os leads existentes. Depende da 0036.
-- Os KPIs (ganho/perdido/inativo) não são afetados — os nomes novos não contêm
-- essas palavras. Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Atualiza os leads existentes ---------------------------------------
update public.crm_leads set status = 'Negociação' where status = 'Aguardando resposta';
update public.crm_leads set status = 'Fechamento'  where status = 'Proposta / Negociação';

-- ---- 2) Renomeia os itens do catálogo (mantém tom e ordem) ------------------
update public.catalog_items set value = 'Negociação', label = 'Negociação'
 where catalog = 'crm_status' and value = 'Aguardando resposta';

update public.catalog_items set value = 'Fechamento', label = 'Fechamento'
 where catalog = 'crm_status' and value = 'Proposta / Negociação';
