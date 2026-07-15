-- ============================================================================
-- CRM — Esteira de upgrade Templo → Singular
-- ----------------------------------------------------------------------------
-- Pedido (All Hands 2026-07-14): criar estratégia de conversão pra fazer o
-- upgrade das alunas do plano Templo pro Singular, aproveitando o
-- relacionamento já estabelecido.
--
-- O upgrade é um NOVO lead no pipeline (a venda nova), vinculado à aluna de
-- origem por upgrade_from. Isso permite:
--   • listar candidatas (alunas Templo ganhas sem lead de upgrade aberto)
--   • medir a conversão da esteira (upgrades ganhos × perdidos)
--   • não duplicar a esteira pra mesma aluna
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

alter table public.crm_leads
  add column if not exists upgrade_from uuid references public.crm_leads (id) on delete set null;

comment on column public.crm_leads.upgrade_from is
  'Lead (aluna ganha) que originou esta oportunidade de upgrade de plano.';

create index if not exists crm_leads_upgrade_from_idx on public.crm_leads (upgrade_from);

-- Origem "Upgrade" no catálogo — identifica a esteira nos relatórios.
insert into public.catalog_items (catalog, value, label, tone, sort)
select 'crm_origin', 'Upgrade', 'Upgrade de plano', 'purple',
       coalesce((select max(sort) + 1 from public.catalog_items where catalog = 'crm_origin'), 0)
where not exists (
  select 1 from public.catalog_items
   where catalog = 'crm_origin' and value = 'Upgrade'
);
