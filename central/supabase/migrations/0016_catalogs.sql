-- ============================================================================
-- Central Anju — catálogos editáveis pelo gestor (genérico)
-- ----------------------------------------------------------------------------
-- Listas que antes eram "chumbadas" no código (categorias de tarefa, tipos do
-- editorial, tipos de mídia dos acessos...) passam a viver numa tabela única,
-- gerida pela UI por quem tem `manage_resources`. Cada item tem:
--   catalog — qual lista (ex.: 'task_category')
--   value   — o valor estável gravado nos registros (ex.: tasks.tag)
--   label   — o texto exibido
--   tone    — cor da paleta do design (badge)
--   sort    — ordem de exibição
--   active  — liga/desliga sem apagar
-- Mesmo padrão da matriz de permissões (role_permissions): RLS + realtime.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.catalog_items (
  id         uuid primary key default gen_random_uuid(),
  catalog    text not null,
  value      text not null,
  label      text not null,
  tone       text not null default 'neutral'
             check (tone in ('steel','sand','warning','danger','success','neutral')),
  sort       int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (catalog, value)
);

create index if not exists catalog_items_catalog_idx
  on public.catalog_items (catalog, sort);

alter table public.catalog_items enable row level security;

-- Todos os autenticados leem (a UI inteira depende dos rótulos/cores).
drop policy if exists catalog_select on public.catalog_items;
create policy catalog_select on public.catalog_items for select to authenticated
  using (true);

-- Só quem gere recursos cria/edita/remove.
drop policy if exists catalog_write on public.catalog_items;
create policy catalog_write on public.catalog_items for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

grant select, insert, update, delete on public.catalog_items to authenticated;
grant select, insert, update, delete on public.catalog_items to service_role;

-- ---- Seed: categorias de tarefa atuais (idempotente por (catalog,value)) ----
insert into public.catalog_items (catalog, value, label, tone, sort) values
  ('task_category','Conteúdo',  'Conteúdo',  'success', 0),
  ('task_category','Design',    'Design',    'steel',   1),
  ('task_category','Edição',    'Edição',    'sand',    2),
  ('task_category','Tráfego',   'Tráfego',   'danger',  3),
  ('task_category','Lançamento','Lançamento','warning', 4),
  ('task_category','Suporte',   'Suporte',   'neutral', 5)
on conflict (catalog, value) do nothing;

-- Categorias agora são livres (geridas pelo catálogo) — sem CHECK fixo na tasks.
alter table public.tasks drop constraint if exists tasks_tag_check;

-- ---- Realtime (entrega ao vivo das mudanças do catálogo) --------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'catalog_items'
  ) then
    alter publication supabase_realtime add table public.catalog_items;
  end if;
end $$;
