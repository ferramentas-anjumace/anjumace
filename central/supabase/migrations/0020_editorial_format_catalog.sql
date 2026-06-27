-- ============================================================================
-- Central Anju — Formato do Editorial vira catálogo editável
-- ----------------------------------------------------------------------------
-- O formato das postagens (carrossel/reels/corte/imagem) sai do hardcoded e
-- passa a ser gerido pela tela Configurações → Catálogos (catalog 'editorial_format').
-- Faz o seed dos formatos atuais e solta o CHECK fixo da coluna.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

insert into public.catalog_items (catalog, value, label, tone, sort) values
  ('editorial_format','carrossel','Carrossel','sand',    0),
  ('editorial_format','reels',    'Reels',    'steel',   1),
  ('editorial_format','corte',    'Corte',    'neutral', 2),
  ('editorial_format','imagem',   'Imagem',   'warning', 3)
on conflict (catalog, value) do nothing;

-- Formato agora é livre (governado pelo catálogo) — sem CHECK fixo.
alter table public.editorial_posts drop constraint if exists editorial_posts_format_check;
