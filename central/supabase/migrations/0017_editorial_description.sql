-- ============================================================================
-- Central Anju — descrição (conteúdo da demanda) nas postagens do editorial
-- ----------------------------------------------------------------------------
-- Substitui o antigo "Conteúdo card-a-card" por um campo de texto livre onde
-- vai o briefing/roteiro/instruções da demanda. A coluna antiga `cards` (jsonb)
-- permanece (não-destrutivo); apenas deixa de ser usada pela UI.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.editorial_posts
  add column if not exists description text;
