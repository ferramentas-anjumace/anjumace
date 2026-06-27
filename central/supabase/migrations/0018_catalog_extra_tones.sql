-- ============================================================================
-- Central Anju — cores extras nos catálogos (além do design system)
-- ----------------------------------------------------------------------------
-- Amplia o conjunto de cores (tone) que um item de catálogo pode ter, incluindo
-- cores fora da paleta do design system (renderizadas com cor explícita na UI).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.catalog_items drop constraint if exists catalog_items_tone_check;

alter table public.catalog_items
  add constraint catalog_items_tone_check
  check (tone in (
    'steel','sand','warning','danger','success','neutral',
    'blue','teal','purple','pink','orange','graphite'
  ));
