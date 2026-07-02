-- ============================================================================
-- Central Anju — CRM Comercial (leads + histórico de interações)
-- ----------------------------------------------------------------------------
-- Pedido da equipe (checkpoint 2026-07-02, Gabriel Mesquita): trazer o CRM da
-- planilha para dentro da Central. Duas tabelas:
--   crm_leads        — cadastro de leads (dados de contato, valor potencial,
--                      etapa do funil, status/pipeline, responsável, datas...)
--   crm_interactions — log de contatos por lead (data, canal, tipo, resumo,
--                      próxima ação). Substitui a coluna manual "Qtd. Interação"
--                      e "Último Contato" da planilha (a UI deriva desses regs).
--
-- O kanban é organizado por `status` (pipeline de vendas). `funnel_stage` é a
-- jornada de consciência (Conscientização→Compra), mantida como atributo.
-- Todos os dropdowns são catálogos editáveis (catalog_items) — a equipe
-- adiciona/remove opções sem depender de deploy.
--
-- RLS: leitura e escrita (insert/update) para TODO o time autenticado — é uma
-- ferramenta operacional compartilhada do comercial. A EXCLUSÃO de leads fica
-- restrita a gestores (public.can('manage_users')) para proteger a base
-- importada (ex.: as ~900 do desafio) de perda acidental. Interações podem ser
-- excluídas por qualquer membro (são anotações próprias).
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- Leads ------------------------------------------------------------------
create table if not exists public.crm_leads (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  whatsapp        text,
  email           text,
  origin          text,           -- catálogo crm_origin
  product         text,           -- catálogo crm_product
  potential_value numeric not null default 0,
  funnel_stage    text,           -- catálogo crm_funnel_stage
  status          text not null default 'Novo',  -- catálogo crm_status (kanban)
  owner_id        uuid references public.profiles (id) on delete set null,
  first_contact_at date,
  next_followup_at date,
  contact_channel text,           -- catálogo crm_channel
  interest        text,           -- catálogo crm_interest (Alto/Médio/Baixo)
  main_objection  text,
  notes           text,           -- Histórico / Observações
  closed_at       date,
  sort            int  not null default 0,  -- ordem dentro da coluna do kanban
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists crm_leads_status_idx on public.crm_leads (status, sort);
create index if not exists crm_leads_owner_idx  on public.crm_leads (owner_id);

-- Mantém updated_at fresco (usado para ordenação estável e sincronização).
create or replace function public.crm_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists crm_leads_touch on public.crm_leads;
create trigger crm_leads_touch before update on public.crm_leads
  for each row execute function public.crm_touch_updated_at();

-- ---- Histórico de interações por lead ---------------------------------------
create table if not exists public.crm_interactions (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.crm_leads (id) on delete cascade,
  date        date not null default current_date,
  owner_id    uuid references public.profiles (id) on delete set null,
  channel     text,               -- catálogo crm_channel
  type        text,               -- catálogo crm_interaction_type
  summary     text,
  next_action text,
  created_at  timestamptz not null default now()
);

create index if not exists crm_interactions_lead_idx
  on public.crm_interactions (lead_id, date);

-- ---- RLS + grants -----------------------------------------------------------
-- Leitura e insert/update para todos os autenticados; delete de leads só gestor.
alter table public.crm_leads enable row level security;

drop policy if exists crm_leads_select on public.crm_leads;
create policy crm_leads_select on public.crm_leads for select to authenticated
  using (true);

drop policy if exists crm_leads_insert on public.crm_leads;
create policy crm_leads_insert on public.crm_leads for insert to authenticated
  with check (true);

drop policy if exists crm_leads_update on public.crm_leads;
create policy crm_leads_update on public.crm_leads for update to authenticated
  using (true) with check (true);

drop policy if exists crm_leads_delete on public.crm_leads;
create policy crm_leads_delete on public.crm_leads for delete to authenticated
  using (public.can('manage_users'));

grant select, insert, update, delete on public.crm_leads to authenticated;
grant select, insert, update, delete on public.crm_leads to service_role;

-- Interações: leitura e escrita completas para o time (anotações próprias).
alter table public.crm_interactions enable row level security;

drop policy if exists crm_interactions_select on public.crm_interactions;
create policy crm_interactions_select on public.crm_interactions for select to authenticated
  using (true);

drop policy if exists crm_interactions_write on public.crm_interactions;
create policy crm_interactions_write on public.crm_interactions for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on public.crm_interactions to authenticated;
grant select, insert, update, delete on public.crm_interactions to service_role;

-- ---- Realtime (entrega ao vivo das mudanças) --------------------------------
do $$
declare t text;
begin
  foreach t in array array['crm_leads','crm_interactions']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- Seed dos catálogos do CRM (idempotente por (catalog, value))
-- ----------------------------------------------------------------------------
-- Espelha os dropdowns da planilha. A equipe pode editar em Configurações →
-- Catálogos. IMPORTANTE: os KPIs do Dashboard identificam "ganho/perdido/
-- inativo" pelo texto do status (contém "Ganho"/"Perdido"/"Inativo"); ao
-- renomear esses status, preserve essas palavras.
-- ============================================================================
insert into public.catalog_items (catalog, value, label, tone, sort) values
  -- Status (pipeline / colunas do kanban)
  ('crm_status','Novo','Novo','blue',0),
  ('crm_status','Em andamento','Em andamento','steel',1),
  ('crm_status','Aguardando resposta','Aguardando resposta','warning',2),
  ('crm_status','Proposta enviada','Proposta enviada','teal',3),
  ('crm_status','Negociação','Negociação','purple',4),
  ('crm_status','Fechado - Ganho','Fechado - Ganho','success',5),
  ('crm_status','Fechado - Perdido','Fechado - Perdido','danger',6),
  ('crm_status','Inativo','Inativo','neutral',7),
  -- Origem do lead
  ('crm_origin','Instagram','Instagram','pink',0),
  ('crm_origin','WhatsApp','WhatsApp','success',1),
  ('crm_origin','Indicação','Indicação','teal',2),
  ('crm_origin','Landing Page','Landing Page','steel',3),
  ('crm_origin','TikTok','TikTok','graphite',4),
  ('crm_origin','YouTube','YouTube','danger',5),
  ('crm_origin','Anúncios','Anúncios','orange',6),
  ('crm_origin','Site','Site','blue',7),
  ('crm_origin','Everfit','Everfit','purple',8),
  ('crm_origin','Outro','Outro','neutral',9),
  -- Produto / serviço de interesse
  ('crm_product','Plano Templo','Plano Templo','sand',0),
  ('crm_product','Plano Singular','Plano Singular','steel',1),
  ('crm_product','Everfit','Everfit','purple',2),
  -- Etapa do funil (jornada de consciência)
  ('crm_funnel_stage','Conscientização','Conscientização','blue',0),
  ('crm_funnel_stage','Interesse','Interesse','teal',1),
  ('crm_funnel_stage','Consideração','Consideração','steel',2),
  ('crm_funnel_stage','Intenção','Intenção','warning',3),
  ('crm_funnel_stage','Avaliação','Avaliação','orange',4),
  ('crm_funnel_stage','Compra','Compra','success',5),
  ('crm_funnel_stage','Desistência','Desistência','danger',6),
  -- Canal de contato
  ('crm_channel','Instagram DM','Instagram DM','pink',0),
  ('crm_channel','WhatsApp','WhatsApp','success',1),
  ('crm_channel','Ligação','Ligação','steel',2),
  ('crm_channel','E-mail','E-mail','blue',3),
  ('crm_channel','Outro','Outro','neutral',4),
  -- Nível de interesse
  ('crm_interest','Alto','Alto','success',0),
  ('crm_interest','Médio','Médio','warning',1),
  ('crm_interest','Baixo','Baixo','danger',2),
  -- Tipo de interação (histórico)
  ('crm_interaction_type','Primeiro contato','Primeiro contato','blue',0),
  ('crm_interaction_type','Follow-up','Follow-up','steel',1),
  ('crm_interaction_type','Proposta','Proposta','teal',2),
  ('crm_interaction_type','Fechamento','Fechamento','success',3)
on conflict (catalog, value) do nothing;
