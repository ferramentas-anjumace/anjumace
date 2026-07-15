-- ============================================================================
-- Editorial — horário de publicação + gaveta de conteúdos
-- ----------------------------------------------------------------------------
-- Pedido (All Hands 2026-07-14):
--   • O relatório de desempenho mostrou picos de engajamento às 7-8h, 11-12h
--     e 20-21h — as postagens serão ajustadas pra esses horários. O post ganha
--     publish_time e a UI sinaliza quando o horário cai fora da janela de pico.
--   • A "gaveta de conteúdos" precisa crescer (10 roteiros em produção).
--     A tabela editorial_ideas guarda ideias/roteiros SEM data; ao agendar,
--     a ideia vira um post do calendário.
--
-- RLS: leitura pra todo o time; escrita com manage_social (mesmo gate da
-- página do Editorial). Aditivo e idempotente. Rode no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Horário de publicação ----------------------------------------------
alter table public.editorial_posts
  add column if not exists publish_time time;

comment on column public.editorial_posts.publish_time is
  'Horário planejado da publicação. Picos de engajamento: 7-8h, 11-12h, 20-21h.';

-- ---- 2) Gaveta de conteúdos --------------------------------------------------
create table if not exists public.editorial_ideas (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null,
  title      text not null,
  format     text,            -- catálogo editorial_format (opcional)
  script     text,            -- roteiro / esboço da copy
  created_by uuid references public.profiles (id) on delete set null,
  sort       int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorial_ideas_client_idx on public.editorial_ideas (client_id, sort);

drop trigger if exists editorial_ideas_touch on public.editorial_ideas;
create trigger editorial_ideas_touch before update on public.editorial_ideas
  for each row execute function public.crm_touch_updated_at();

alter table public.editorial_ideas enable row level security;

drop policy if exists editorial_ideas_select on public.editorial_ideas;
create policy editorial_ideas_select on public.editorial_ideas for select to authenticated
  using (true);

drop policy if exists editorial_ideas_insert on public.editorial_ideas;
create policy editorial_ideas_insert on public.editorial_ideas for insert to authenticated
  with check (public.can('manage_social'));

drop policy if exists editorial_ideas_update on public.editorial_ideas;
create policy editorial_ideas_update on public.editorial_ideas for update to authenticated
  using (public.can('manage_social')) with check (public.can('manage_social'));

drop policy if exists editorial_ideas_delete on public.editorial_ideas;
create policy editorial_ideas_delete on public.editorial_ideas for delete to authenticated
  using (public.can('manage_social'));

grant select, insert, update, delete on public.editorial_ideas to authenticated;
grant select, insert, update, delete on public.editorial_ideas to service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'editorial_ideas'
  ) then
    execute 'alter publication supabase_realtime add table public.editorial_ideas';
  end if;
end $$;
