-- ============================================================================
-- Central Anju — Tráfego Pago (mídia paga: Meta + Google)
-- ----------------------------------------------------------------------------
-- Estrutura para a seção de Tráfego Pago. Quatro tabelas:
--   paid_campaigns — campanhas (plataforma, objetivo, status, orçamento)
--   paid_metrics   — métrica diária por campanha (gasto, impressões, cliques,
--                    leads, vendas, faturamento) → fonte de todos os KPIs
--   paid_creatives — criativos (estático/vídeo/carrossel) com métricas agregadas
--   paid_pages     — páginas de captura (visitas, leads, investimento)
--
-- A UI deriva tudo (CPL, CPA, CPC, CTR, ROAS, séries, rankings) destes registros.
-- Enquanto estas tabelas estiverem vazias, a tela usa um dataset de demonstração
-- embutido no front (paidTraffic.ts). Ao popular aqui — via integração com a API
-- do Meta/Google ou entrada manual — a tela passa a refletir os dados reais.
--
-- Leitura: todos os autenticados. Escrita: quem tem `manage_resources`.
-- Inclui um SEED de demonstração (90 dias) para validar a tela com dados reais.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- ---- Campanhas --------------------------------------------------------------
create table if not exists public.paid_campaigns (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null check (platform in ('meta','google')),
  name         text not null,
  objective    text not null default '',
  status       text not null default 'active' check (status in ('active','paused','ended')),
  daily_budget numeric not null default 0,
  created_at   timestamptz not null default now()
);

-- ---- Métrica diária por campanha -------------------------------------------
create table if not exists public.paid_metrics (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.paid_campaigns (id) on delete cascade,
  date        date not null,
  spend       numeric not null default 0,
  impressions bigint  not null default 0,
  clicks      bigint  not null default 0,
  leads       bigint  not null default 0,
  sales       numeric not null default 0,
  revenue     numeric not null default 0,
  unique (campaign_id, date)
);
create index if not exists paid_metrics_campaign_date_idx
  on public.paid_metrics (campaign_id, date);
create index if not exists paid_metrics_date_idx
  on public.paid_metrics (date);

-- ---- Criativos --------------------------------------------------------------
create table if not exists public.paid_creatives (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.paid_campaigns (id) on delete cascade,
  platform    text not null check (platform in ('meta','google')),
  name        text not null,
  type        text not null check (type in ('static','video','carousel')),
  spend       numeric not null default 0,
  impressions bigint  not null default 0,
  clicks      bigint  not null default 0,
  leads       bigint  not null default 0,
  video_views bigint,
  thumb_hex   text,
  created_at  timestamptz not null default now()
);

-- ---- Páginas de captura -----------------------------------------------------
create table if not exists public.paid_pages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  url        text not null default '',
  visits     bigint  not null default 0,
  leads      bigint  not null default 0,
  spend      numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ---- RLS + grants (mesmo padrão de catalog_items) ---------------------------
do $$
declare t text;
begin
  foreach t in array array['paid_campaigns','paid_metrics','paid_creatives','paid_pages']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select', t);

    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.can(''manage_resources'')) with check (public.can(''manage_resources''))',
      t || '_write', t);

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;

-- ---- Realtime (entrega ao vivo das mudanças) --------------------------------
do $$
declare t text;
begin
  foreach t in array array['paid_campaigns','paid_metrics','paid_creatives','paid_pages']
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
-- SEED de demonstração — campanhas + 90 dias de métricas + criativos + páginas
-- ----------------------------------------------------------------------------
-- Idempotente: só insere se ainda não houver campanhas. Para começar do zero
-- (dados reais), basta não rodar este bloco ou limpar as tabelas depois.
-- ============================================================================
do $$
declare
  has_data boolean;
  c record;
  d date;
  prog numeric;
  weekend numeric;
  trend numeric;
  noise numeric;
  recent numeric;
  spend numeric;
  impr bigint;
  clk bigint;
  lds bigint;
  sls numeric;
begin
  select exists(select 1 from public.paid_campaigns) into has_data;
  if has_data then return; end if;

  -- Campanhas (espelham os perfis do mock do front).
  insert into public.paid_campaigns (id, platform, name, objective, status, daily_budget) values
    ('c0000000-0000-4000-8000-000000000001','meta','Captação Leads — App 7 dias','Cadastros','active',350),
    ('c0000000-0000-4000-8000-000000000002','meta','Remarketing — TMS Quente','Conversões','active',180),
    ('c0000000-0000-4000-8000-000000000003','meta','Reconhecimento — Topo de Funil','Alcance','active',220),
    ('c0000000-0000-4000-8000-000000000004','meta','Lançamento TMS — CPL','Cadastros','paused',500),
    ('c0000000-0000-4000-8000-000000000005','google','Search — Marca Anju Mace','Pesquisa','active',120),
    ('c0000000-0000-4000-8000-000000000006','google','Performance Max — Geral','PMax','active',300),
    ('c0000000-0000-4000-8000-000000000007','google','YouTube — Glúteos de Aço','Vídeo','active',160),
    ('c0000000-0000-4000-8000-000000000008','google','Display — Remarketing GDA','Display','ended',90);

  -- Métricas diárias (últimos 90 dias) por campanha.
  for c in
    select * from (values
      ('c0000000-0000-4000-8000-000000000001'::uuid, 320, 18, 0.021, 0.14, 0.08, 1.0),
      ('c0000000-0000-4000-8000-000000000002'::uuid, 160, 24, 0.034, 0.22, 0.16, 1.0),
      ('c0000000-0000-4000-8000-000000000003'::uuid, 210, 11, 0.012, 0.06, 0.03, 1.0),
      ('c0000000-0000-4000-8000-000000000004'::uuid, 470, 16, 0.024, 0.18, 0.10, 0.05),
      ('c0000000-0000-4000-8000-000000000005'::uuid,  95, 42, 0.085, 0.28, 0.20, 1.0),
      ('c0000000-0000-4000-8000-000000000006'::uuid, 280, 20, 0.018, 0.12, 0.09, 1.0),
      ('c0000000-0000-4000-8000-000000000007'::uuid, 140,  9, 0.009, 0.05, 0.025, 1.0),
      ('c0000000-0000-4000-8000-000000000008'::uuid,  80,  7, 0.006, 0.04, 0.02, 0.0)
    ) as t(id, base_spend, cpm, ctr, cvr, lead_to_sale, recent_factor)
  loop
    for i in 0..89 loop
      d := current_date - i;
      prog := (89 - i)::numeric / 89;
      weekend := case when extract(dow from d) in (0,6) then 0.78 else 1 end;
      trend := 0.8 + 0.4 * prog;
      noise := 0.75 + 0.5 * random();
      recent := case when i < 14 then (c.recent_factor)::numeric else 1 end;
      spend := (c.base_spend)::numeric * trend * weekend * noise * recent;
      if spend < 1 then
        insert into public.paid_metrics (campaign_id, date, spend, impressions, clicks, leads, sales, revenue)
        values (c.id, d, 0, 0, 0, 0, 0, 0)
        on conflict (campaign_id, date) do nothing;
        continue;
      end if;
      impr := round((spend / (c.cpm)::numeric) * 1000 * (0.9 + 0.2 * random()));
      clk  := round(impr * (c.ctr)::numeric * (0.85 + 0.3 * random()));
      lds  := round(clk * (c.cvr)::numeric * (0.8 + 0.4 * random()));
      sls  := clk * (c.cvr)::numeric * (c.lead_to_sale)::numeric * (0.7 + 0.6 * random());
      insert into public.paid_metrics (campaign_id, date, spend, impressions, clicks, leads, sales, revenue)
      values (c.id, d, round(spend), impr, clk, lds, round(sls::numeric, 1), round(sls * 2400))
      on conflict (campaign_id, date) do nothing;
    end loop;
  end loop;

  -- Criativos (métricas agregadas de demonstração).
  insert into public.paid_creatives (campaign_id, platform, name, type, spend, impressions, clicks, leads, video_views, thumb_hex) values
    ('c0000000-0000-4000-8000-000000000001','meta','VSL — Método TMS em 8 semanas','video',4200,260000,5400,360,52000,'#9eab87'),
    ('c0000000-0000-4000-8000-000000000001','meta','Depoimento — Transformação real','video',3100,190000,3600,280,38000,'#3f6fa6'),
    ('c0000000-0000-4000-8000-000000000001','meta','Card — 3 erros que travam o glúteo','static',2400,150000,2900,190,null,'#cc7836'),
    ('c0000000-0000-4000-8000-000000000002','meta','Carrossel — Antes e depois','carousel',3600,160000,4800,420,null,'#7a5bb0'),
    ('c0000000-0000-4000-8000-000000000002','meta','Reels — Bastidores do treino','video',2200,140000,3100,240,41000,'#2f9c9c'),
    ('c0000000-0000-4000-8000-000000000003','meta','Estático — Manifesto Anju Mace','static',1900,210000,2200,120,null,'#c45c93'),
    ('c0000000-0000-4000-8000-000000000003','meta','Vídeo — Hook 7s','video',2100,230000,2500,140,46000,'#5b6470'),
    ('c0000000-0000-4000-8000-000000000005','google','Search — Anúncio dinâmico','static',2900,90000,7200,560,null,'#9eab87'),
    ('c0000000-0000-4000-8000-000000000006','google','PMax — Conjunto criativo A','static',3300,180000,3500,290,null,'#3f6fa6'),
    ('c0000000-0000-4000-8000-000000000006','google','PMax — Vídeo quadrado','video',2700,210000,2900,210,58000,'#cc7836'),
    ('c0000000-0000-4000-8000-000000000007','google','YouTube — Glúteos de Aço 6s','video',1800,320000,2100,90,120000,'#7a5bb0'),
    ('c0000000-0000-4000-8000-000000000007','google','YouTube — In-stream 30s','video',1700,280000,1900,85,98000,'#2f9c9c');

  -- Páginas de captura.
  insert into public.paid_pages (name, url, visits, leads, spend) values
    ('Captura — App 7 dias','/app-7-dias',22000,7200,12000),
    ('VSL — Página de vendas TMS','/vsl-tms',16000,1200,9800),
    ('Aula gratuita — Inscrição','/aula-gratuita',14000,5600,7400),
    ('Quiz — Diagnóstico corporal','/quiz-corporal',9000,2300,5200),
    ('Landing — Lançamento TMS','/lancamento-tms',6800,1250,4100);
end $$;
