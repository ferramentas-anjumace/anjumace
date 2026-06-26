-- ============================================================================
-- Central Anju — categorias de tarefa (área/tipo de trabalho)
-- ----------------------------------------------------------------------------
-- Antes: 'Cliente' | 'Suporte' | 'Conteúdo' | 'Interno'.
-- Agora: 'Conteúdo' | 'Design' | 'Edição' | 'Tráfego' | 'Lançamento' | 'Suporte'.
-- Valores antigos fora do novo conjunto viram NULL (sem categoria).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.tasks drop constraint if exists tasks_tag_check;

update public.tasks
  set tag = null
  where tag is not null
    and tag not in ('Conteúdo','Design','Edição','Tráfego','Lançamento','Suporte');

alter table public.tasks
  add constraint tasks_tag_check
  check (tag in ('Conteúdo','Design','Edição','Tráfego','Lançamento','Suporte'));
