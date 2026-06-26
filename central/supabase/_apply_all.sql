-- ============================================================================
-- Central Anju — TODAS as migrations (0001→0005) concatenadas para o SQL Editor
-- Gerado automaticamente. Rode INTEIRO no Supabase → SQL Editor → New query → Run.
-- ============================================================================


-- >>>>>>>>>>>>>>>>>>>> 0001_init.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central UpSkl — esquema inicial (Fase 1)
-- ----------------------------------------------------------------------------
-- Rode este arquivo INTEIRO no Supabase → SQL Editor → New query → Run.
-- Cria tabelas, segurança (RLS) e já cadastra o cliente Anju Mace.
-- Idempotente: pode rodar de novo sem quebrar.
-- ============================================================================

-- ---------------------------------------------------------------- PROFILES ---
-- Espelha auth.users com nome e papel (fonte da gestão de usuários).
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text,
  role        text not null default 'colaborador' check (role in ('admin','colaborador')),
  team        text,
  status      text not null default 'ativo' check (status in ('ativo','convidado','suspenso')),
  created_at  timestamptz not null default now()
);

-- Cria o profile automaticamente quando um usuário é criado no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'role',''), 'colaborador')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: traz para profiles quem já existe no Auth (ex.: seu admin).
insert into public.profiles (id, name, email, role)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'name',''), split_part(u.email,'@',1)),
       u.email,
       coalesce(nullif(u.raw_user_meta_data->>'role',''), 'colaborador')
from auth.users u
on conflict (id) do nothing;

-- ----------------------------------------------------------------- CLIENTS ---
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  segment    text,
  phase      text,
  status     text not null default 'ativo' check (status in ('ativo','onboarding','pausado')),
  contact    text,
  since      text,
  progress   int  not null default 0,
  avatar     text,
  created_at timestamptz not null default now()
);

create table if not exists public.client_media (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  label     text not null,
  kind      text not null check (kind in ('imagens','videos','marca','conteudos')),
  url       text,
  hint      text,
  sort      int not null default 0
);

create table if not exists public.client_credentials (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  platform  text not null,
  url       text,
  username  text,
  password  text,
  note      text,
  sort      int not null default 0
);

-- ------------------------------------------------------------------- TASKS ---
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  status       text not null default 'a-fazer'
               check (status in ('a-fazer','em-andamento','em-revisao','concluida')),
  priority     text not null default 'media'
               check (priority in ('baixa','media','alta','urgente')),
  assignees    uuid[] not null default '{}',
  due          date,
  tag          text check (tag in ('Cliente','Suporte','Conteúdo','Interno')),
  client_id    uuid references public.clients(id) on delete set null,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.task_events (
  id      uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  at      timestamptz not null default now(),
  who     text not null,
  text    text not null
);

-- ------------------------------------------------------------------ AGENDA ---
create table if not exists public.agenda_events (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  time        text,
  title       text not null,
  meta        text,
  category    text not null default 'steel' check (category in ('steel','sand','success','danger')),
  description text,
  meeting_url text,
  location    text,
  client_id   uuid references public.clients(id) on delete set null,
  people      uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- =============================================================== SEGURANÇA ===
-- Helper: o usuário logado é admin? (agora as tabelas já existem)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles            enable row level security;
alter table public.clients             enable row level security;
alter table public.client_media        enable row level security;
alter table public.client_credentials  enable row level security;
alter table public.tasks               enable row level security;
alter table public.task_events         enable row level security;
alter table public.agenda_events       enable row level security;

-- Helper para (re)criar policy sem erro se já existir.
-- PROFILES: todos autenticados leem; só admin escreve (e cada um edita o próprio nome).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- CLIENTS: todos leem; só admin escreve.
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated using (true);
drop policy if exists clients_admin_write on public.clients;
create policy clients_admin_write on public.clients for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- MEDIA: todos leem; só admin escreve.
drop policy if exists media_select on public.client_media;
create policy media_select on public.client_media for select to authenticated using (true);
drop policy if exists media_admin_write on public.client_media;
create policy media_admin_write on public.client_media for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- CREDENCIAIS (senhas): só admin lê e escreve.
drop policy if exists cred_admin_all on public.client_credentials;
create policy cred_admin_all on public.client_credentials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- TASKS: todos leem; admin cria/exclui; qualquer autenticado atualiza (dar check).
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (true);
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_admin());
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated using (true) with check (true);
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_admin());

-- TASK_EVENTS: todos leem; todos autenticados inserem (histórico).
drop policy if exists events_select on public.task_events;
create policy events_select on public.task_events for select to authenticated using (true);
drop policy if exists events_insert on public.task_events;
create policy events_insert on public.task_events for insert to authenticated with check (true);

-- AGENDA: todos leem; só admin escreve.
drop policy if exists agenda_select on public.agenda_events;
create policy agenda_select on public.agenda_events for select to authenticated using (true);
drop policy if exists agenda_admin_write on public.agenda_events;
create policy agenda_admin_write on public.agenda_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================ SEED: ANJU ===
-- Cliente real Anju Mace (uuid fixo para estabilidade).
insert into public.clients (id, name, segment, phase, status, contact, since, progress)
values ('a0000000-0000-4000-8000-000000000c06',
        'Anju Mace', 'Personal trainer & nutricionista', 'Soft opening',
        'ativo', 'contato@anjumace.fit', 'jun 2026', 42)
on conflict (id) do nothing;

-- Bancos & mídia da Anju.
insert into public.client_media (client_id, label, kind, url, hint, sort) values
  ('a0000000-0000-4000-8000-000000000c06','Banco de imagens','imagens','https://drive.google.com/anjumace/imagens','Google Drive · fotos e artes',1),
  ('a0000000-0000-4000-8000-000000000c06','Banco de vídeos','videos','https://drive.google.com/anjumace/videos','Google Drive · reels e bastidores',2),
  ('a0000000-0000-4000-8000-000000000c06','Identidade visual','marca','https://figma.com/anjumace/brand','Figma · logo, cores e tipografia',3),
  ('a0000000-0000-4000-8000-000000000c06','Banco de conteúdos','conteudos','https://notion.so/anjumace/conteudos','Notion · biblioteca de conteúdos',4)
on conflict do nothing;

-- Acessos da Anju (senhas como placeholder — troque pelas reais quando quiser).
-- Dica: depois de validar, você edita pela própria central (aba Acessos).
insert into public.client_credentials (client_id, platform, url, username, password, note, sort) values
  ('a0000000-0000-4000-8000-000000000c06','Circle','https://anju-mace.circle.so/','administrativo@anjumace.com.br','••••••••','Comunidade',1),
  ('a0000000-0000-4000-8000-000000000c06','Stripe','https://dashboard.stripe.com','financeiro@anjumace.com.br','••••••••','Financeiro · MFA necessário',2),
  ('a0000000-0000-4000-8000-000000000c06','Instagram','https://instagram.com/anjumace','@anjumace','••••••••','Rede social',3)
on conflict do nothing;

-- Fim. Próximas fases: o app passa a ler/gravar nestas tabelas.


-- >>>>>>>>>>>>>>>>>>>> 0002_grants.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central UpSkl — privilégios de tabela (corrige "permission denied")
-- ----------------------------------------------------------------------------
-- Dá ao papel `authenticated` (usuário logado) o direito de comandar as tabelas.
-- O RLS (definido na 0001) continua sendo quem filtra QUAIS linhas cada um vê.
-- Rode este arquivo inteiro no SQL Editor → Run.
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.clients,
  public.client_media,
  public.client_credentials,
  public.tasks,
  public.task_events,
  public.agenda_events
to authenticated;

-- Sequências (caso alguma tabela use), para não travar inserts.
grant usage, select on all sequences in schema public to authenticated;

-- Tabelas futuras criadas pelo mesmo dono já nascem com acesso.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;


-- >>>>>>>>>>>>>>>>>>>> 0003_grants_service_role.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central UpSkl — privilégios para o papel service_role
-- ----------------------------------------------------------------------------
-- A função serverless (criar usuário) usa a service_role. Aqui damos a ela
-- acesso às tabelas (a 0002 só cobriu `authenticated`). Rode inteiro no SQL Editor.
-- ============================================================================

grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Tabelas/sequências futuras já nascem com acesso para a service_role.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;


-- >>>>>>>>>>>>>>>>>>>> 0004_seed_anju_credentials.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central UpSkl — acessos da Anju Mace (39 plataformas)
-- ----------------------------------------------------------------------------
-- Substitui os acessos de exemplo pelos 39 reais (senhas como placeholder
-- "••••••••" — troque pelas reais depois, pela própria central).
-- Rode inteiro no SQL Editor → Run. Idempotente: limpa antes de inserir.
-- ============================================================================

delete from public.client_credentials
where client_id = 'a0000000-0000-4000-8000-000000000c06';

insert into public.client_credentials (client_id, platform, url, username, password, note, sort) values
  ('a0000000-0000-4000-8000-000000000c06','Circle','https://anju-mace.circle.so/','administrativo@anjumace.com.br','••••••••','Comunidade',1),
  ('a0000000-0000-4000-8000-000000000c06','Everfit','https://everfit.io/login','administrativo@anjumace.com.br','••••••••','Treinos',2),
  ('a0000000-0000-4000-8000-000000000c06','Salvy','https://app.salvy.com.br','administrativo@anjumace.com.br','••••••••','Telefonia',3),
  ('a0000000-0000-4000-8000-000000000c06','Stripe','https://dashboard.stripe.com','financeiro@anjumace.com.br','••••••••','Financeiro · MFA necessário',4),
  ('a0000000-0000-4000-8000-000000000c06','Zapier','https://zapier.com/app/login','administrativo@anjumace.com.br','••••••••','Automações',5),
  ('a0000000-0000-4000-8000-000000000c06','DevZap','https://app.devzap.com.br','administrativo@anjumace.com.br','••••••••','WhatsApp / automação',6),
  ('a0000000-0000-4000-8000-000000000c06','E-mail Admin','https://webmail.anjumace.com.br','administrativo@anjumace.com.br','••••••••','E-mail administrativo',7),
  ('a0000000-0000-4000-8000-000000000c06','Meta Ads','https://business.facebook.com','lucianasmac@gmail.com','••••••••','Conta de anúncios',8),
  ('a0000000-0000-4000-8000-000000000c06','Cademi','https://anjumace.cademi.com.br/dashboard/inicio','anjuinstag@gmail.com','••••••••','Área de membros',9),
  ('a0000000-0000-4000-8000-000000000c06','ManyChat','https://manychat.com','lucianasmac@gmail.com','••••••••','Logar com Facebook',10),
  ('a0000000-0000-4000-8000-000000000c06','Panda','https://dashboard.pandavideo.com.br','anjuinstag@gmail.com','••••••••','Hospedagem de vídeo',11),
  ('a0000000-0000-4000-8000-000000000c06','DevZapp','https://app.devzapp.com.br','anjuinstag@gmail.com','••••••••','WhatsApp / automação',12),
  ('a0000000-0000-4000-8000-000000000c06','Eduzz','https://www.eduzz.com','anjuinstag@gmail.com','••••••••','Pagamentos / produtos',13),
  ('a0000000-0000-4000-8000-000000000c06','Guru','https://app.digitalmanager.guru','—','—','Acesso administrativo pendente — solicitar liberação por e-mail',14),
  ('a0000000-0000-4000-8000-000000000c06','Instagram','https://instagram.com/anjumace','@anjumace','••••••••','Rede social',15),
  ('a0000000-0000-4000-8000-000000000c06','YouTube','https://youtube.com','administrativo@anjumace.com.br','••••••••','Rede social',16),
  ('a0000000-0000-4000-8000-000000000c06','TikTok','https://tiktok.com/@anjumace','@anjumace','••••••••','Rede social',17),
  ('a0000000-0000-4000-8000-000000000c06','Site (Admin)','https://www.anjumace.com.br/admin','admin','••••••••','Painel do site',18),
  ('a0000000-0000-4000-8000-000000000c06','Pinterest','https://pinterest.com','administrativo@anjumace.com.br','••••••••','Rede social',19),
  ('a0000000-0000-4000-8000-000000000c06','Cloudflare','https://dash.cloudflare.com','administrativo@anjumace.com.br','••••••••','DNS / CDN',20),
  ('a0000000-0000-4000-8000-000000000c06','TurboCloud','https://painel.turbocloud.com.br','anjuinstag@gmail.com','••••••••','Hospedagem do site anjumace.com.br',21),
  ('a0000000-0000-4000-8000-000000000c06','Panda Video','https://dashboard.pandavideo.com.br','anjuinstag@gmail.com','••••••••','Hospedagem de vídeo',22),
  ('a0000000-0000-4000-8000-000000000c06','WordPress','https://www.anjumace.com.br/wp-admin','admin','••••••••','Site (WP)',23),
  ('a0000000-0000-4000-8000-000000000c06','E-mail Suporte','https://webmail.anjumace.com.br','suporte@anjumace.com.br','••••••••','Suporte · +55 61 98144-7368',24),
  ('a0000000-0000-4000-8000-000000000c06','Typeform','https://admin.typeform.com','administrativo@anjumace.com.br','••••••••','Formulários',25),
  ('a0000000-0000-4000-8000-000000000c06','Nuclino','https://app.nuclino.com','contact@upskala.com','••••••••','Conta UpSkl · base de conhecimento',26),
  ('a0000000-0000-4000-8000-000000000c06','Alugamed Phone Tracker','','contact@upskala.com','••••••••','Conta UpSkl',27),
  ('a0000000-0000-4000-8000-000000000c06','Autentique','https://painel.autentique.com.br','contact@upskala.com','••••••••','Conta UpSkl · assinaturas',28),
  ('a0000000-0000-4000-8000-000000000c06','ClickUp','https://app.clickup.com','contact@upskala.com','••••••••','Conta UpSkl · gestão de tarefas',29),
  ('a0000000-0000-4000-8000-000000000c06','eSignatures','https://esignatures.com','contact@upskala.com','••••••••','Conta UpSkl · assinaturas',30),
  ('a0000000-0000-4000-8000-000000000c06','GoDaddy','https://godaddy.com','contact@upskala.com','••••••••','Conta UpSkl · domínios',31),
  ('a0000000-0000-4000-8000-000000000c06','Google','https://accounts.google.com','contact@upskala.com','••••••••','Conta UpSkl',32),
  ('a0000000-0000-4000-8000-000000000c06','Hotmart','https://app.hotmart.com','contact@upskala.com','••••••••','Conta UpSkl · produtos',33),
  ('a0000000-0000-4000-8000-000000000c06','Sprout Social','https://app.sproutsocial.com','contact@upskala.com','••••••••','Conta UpSkl · social',34),
  ('a0000000-0000-4000-8000-000000000c06','StayCloud','https://app.staycloud.com.br','contact@upskala.com','••••••••','Conta UpSkl · hospedagem',35),
  ('a0000000-0000-4000-8000-000000000c06','Meu Contador','https://app.meucontador.com.br','contact@upskala.com','••••••••','Conta UpSkl · contabilidade',36),
  ('a0000000-0000-4000-8000-000000000c06','n8n','https://n8n.io','contact@upskala.com','••••••••','Conta UpSkl · automações',37),
  ('a0000000-0000-4000-8000-000000000c06','Vimeo','https://vimeo.com','contact@upskala.com','••••••••','Conta UpSkl · vídeo',38),
  ('a0000000-0000-4000-8000-000000000c06','ActiveCampaign','https://anjumaceapp.activehosted.com','anjumaceapp','••••••••','E-mail marketing',39);


-- >>>>>>>>>>>>>>>>>>>> 0005_task_checklist.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — subtarefas / checklist nas tarefas
-- ----------------------------------------------------------------------------
-- Adiciona a coluna `checklist` (jsonb) na tabela tasks. Cada item:
--   { "id": "...", "text": "...", "done": false }
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.tasks
  add column if not exists checklist jsonb not null default '[]'::jsonb;


-- >>>>>>>>>>>>>>>>>>>> 0006_profile_avatar.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — foto (avatar) dos usuários do time
-- ----------------------------------------------------------------------------
-- 1. Coluna `avatar` (data URL) na tabela profiles.
-- 2. Cada usuário passa a poder editar O PRÓPRIO perfil (nome + foto) — antes
--    só admin escrevia. O trigger de guarda impede que um colaborador use
--    essa permissão para escalar privilégio (mudar role/status/team/email).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- 1) Coluna da foto (mesmo padrão de clients.avatar — data URL em text).
alter table public.profiles
  add column if not exists avatar text;

-- 2) Guarda: quando quem atualiza NÃO é admin (e está autenticado), os campos
--    sensíveis ficam congelados no valor antigo. Sobra editar `name` e `avatar`.
--    service_role (auth.uid() nulo) e admin passam livres.
create or replace function public.profiles_guard_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id     := old.id;
    new.role   := old.role;
    new.status := old.status;
    new.team   := old.team;
    new.email  := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_self_update on public.profiles;
create trigger profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.profiles_guard_self_update();

-- 3) Policy: cada um atualiza a própria linha (o trigger acima limita as colunas).
--    A policy de admin (profiles_admin_write) continua valendo para gerir todos.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);


-- >>>>>>>>>>>>>>>>>>>> 0007_roles_three.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — papéis: Administrador, Liderança, Time
-- ----------------------------------------------------------------------------
-- Antes: 'admin' | 'colaborador'. Agora: 'admin' | 'lideranca' | 'time'.
--   - admin     → Administrador (gestor, controle total)
--   - lideranca → Liderança     (gestor, controle total — mesmos poderes do admin)
--   - time      → Time          (membro comum, acesso restrito)
-- 'colaborador' antigo vira 'time'. Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- 1) Troca o CHECK do papel e migra os valores antigos.
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'time' where role not in ('admin','lideranca','time');
alter table public.profiles alter column role set default 'time';
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin','lideranca','time'));

-- 2) Gestores = admin OU liderança (afeta toda a escrita protegida por RLS).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','lideranca')
  );
$$;

-- 3) Profile novo nasce como 'time' (antes 'colaborador').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'role',''), 'time')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- >>>>>>>>>>>>>>>>>>>> 0008_notifications.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — notificações in-app
-- ----------------------------------------------------------------------------
-- Usada pela automação de tarefas: ao enviar uma tarefa para revisão, os
-- gestores (admin/liderança) recebem uma notificação. Cada pessoa só lê e
-- marca como lidas as PRÓPRIAS; qualquer autenticado pode INSERIR (para poder
-- notificar terceiros). Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  task_id    uuid references public.tasks(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

-- Cada um lê as próprias.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- Cada um marca as próprias como lidas (e só pode mexer nas próprias).
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cada um exclui as próprias (limpar a caixa).
drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- Qualquer autenticado pode criar (a automação notifica os revisores).
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert to authenticated
  with check (true);

-- Privilégios de tabela (a 0002/0003 já cobrem por default privileges, mas
-- garantimos explicitamente para tabelas criadas fora daquele fluxo).
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

-- Habilita Realtime para entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

