-- ============================================================================
-- CS — checklist de onboarding por caso
-- ----------------------------------------------------------------------------
-- Jornada da responsável de CS (áudio, 2026-07-09): depois que o comercial
-- fecha, a cliente entra na Circle; o CS acompanha as notificações e faz o
-- onboarding por lá — acolher, orientar o preenchimento do formulário (Templo
-- ou Templo Singular), verificar a primeira missão e o perfil.
--
--   1) Catálogo cs_checklist — os passos do script (editável em Catálogos;
--      se o script do Otávio mudar, a equipe atualiza sem deploy)
--   2) Tabela cs_case_checks — passo concluído por caso (quem e quando)
--
-- O progresso (3/5…) é derivado na UI. RLS igual ao CS: time lê, manage_crm
-- escreve. Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Catálogo dos passos do onboarding -------------------------------------
insert into public.catalog_items (catalog, value, label, tone, sort)
select v.catalog, v.value, v.label, v.tone, v.sort
from (values
  ('cs_checklist','Entrou na Circle','Entrou na Circle','blue',0),
  ('cs_checklist','Acolhimento feito','Acolhimento feito','teal',1),
  ('cs_checklist','Formulário preenchido','Formulário preenchido','steel',2),
  ('cs_checklist','Primeira missão concluída','Primeira missão concluída','warning',3),
  ('cs_checklist','Perfil completo','Perfil completo','success',4)
) as v(catalog, value, label, tone, sort)
where not exists (
  select 1 from public.catalog_items c
   where c.catalog = v.catalog and c.value = v.value
);

-- ---- 2) Passos concluídos por caso ---------------------------------------------
create table if not exists public.cs_case_checks (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.cs_cases (id) on delete cascade,
  item       text not null,   -- valor do catálogo cs_checklist
  done_by    uuid references public.profiles (id) on delete set null,
  done_at    timestamptz not null default now(),
  unique (case_id, item)
);

create index if not exists cs_case_checks_case_idx on public.cs_case_checks (case_id);

-- ---- RLS + grants ---------------------------------------------------------------
alter table public.cs_case_checks enable row level security;

drop policy if exists cs_case_checks_select on public.cs_case_checks;
create policy cs_case_checks_select on public.cs_case_checks for select to authenticated
  using (true);

drop policy if exists cs_case_checks_write on public.cs_case_checks;
create policy cs_case_checks_write on public.cs_case_checks for all to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

grant select, insert, update, delete on public.cs_case_checks to authenticated;
grant select, insert, update, delete on public.cs_case_checks to service_role;

-- ---- Realtime --------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'cs_case_checks'
  ) then
    execute 'alter publication supabase_realtime add table public.cs_case_checks';
  end if;
end $$;
