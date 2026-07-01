-- ============================================================================
-- Central Anju — Copy, Legenda e Aprovação em etapas no Editorial
-- ----------------------------------------------------------------------------
-- Pedido da equipe (reunião 2026-06-29, Evandro Ciqueira): gerir a copy e a
-- legenda dentro da ferramenta e ter etapas de aprovação editorial.
--
-- Adiciona ao post:
--   copy         → texto da copy do criativo (o que a Anju revisa)
--   caption      → legenda do post
--   copy_status  → aprovação da COPY   (pendente | aprovado | ajuste)
--   art_status   → aprovação da ARTE/VÍDEO (pendente | aprovado | ajuste)
--   approval_log → histórico de aprovações [{id,track,status,by,byName,at,note}]
--
-- Aditivo e idempotente — não mexe em dados existentes. A RLS/grants e o
-- Realtime da tabela já cobrem as colunas novas (herdadas da 0011).
-- Rode inteiro no SQL Editor → Run.
-- ============================================================================

alter table public.editorial_posts
  add column if not exists copy         text,
  add column if not exists caption      text,
  add column if not exists copy_status  text not null default 'pendente',
  add column if not exists art_status   text not null default 'pendente',
  add column if not exists approval_log jsonb not null default '[]'::jsonb;

-- CHECKs soltos (drop+recreate para idempotência).
alter table public.editorial_posts drop constraint if exists editorial_copy_status_chk;
alter table public.editorial_posts add  constraint editorial_copy_status_chk
  check (copy_status in ('pendente','aprovado','ajuste'));

alter table public.editorial_posts drop constraint if exists editorial_art_status_chk;
alter table public.editorial_posts add  constraint editorial_art_status_chk
  check (art_status in ('pendente','aprovado','ajuste'));
