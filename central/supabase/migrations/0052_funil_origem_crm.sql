-- ============================================================================
-- CRM — origem "Guia (E-book)" para leads promovidos do funil de atração
-- ----------------------------------------------------------------------------
-- A aba "Leads do Guia" na Central promove funnel_leads pro CRM; a origem
-- identifica a esteira nos relatórios (origem dos leads novos, All Hands).
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

insert into public.catalog_items (catalog, value, label, tone, sort)
select 'crm_origin', 'Guia', 'Guia (E-book)', 'teal',
       coalesce((select max(sort) + 1 from public.catalog_items where catalog = 'crm_origin'), 0)
where not exists (
  select 1 from public.catalog_items
   where catalog = 'crm_origin' and value = 'Guia'
);
