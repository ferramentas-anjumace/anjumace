-- ============================================================================
-- Central Anju — TODAS as migrations (0001→0019) concatenadas para o SQL Editor
-- Gerado automaticamente por _build_apply_all.sh. NÃO edite à mão.
-- Rode INTEIRO no Supabase → SQL Editor → New query → Run. Idempotente.
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

-- >>>>>>>>>>>>>>>>>>>> 0009_task_categories.sql >>>>>>>>>>>>>>>>>>>>

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

-- >>>>>>>>>>>>>>>>>>>> 0010_role_permissions.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — controle de permissões por papel (matriz configurável)
-- ----------------------------------------------------------------------------
-- Gestores controlam o que cada papel pode fazer. As capacidades:
--   create_task       — criar tarefas
--   move_task         — mover/concluir tarefas
--   manage_users      — criar/excluir pessoas e trocar papéis
--   manage_resources  — gerir acessos, agenda, editorial, conteúdo, clientes
-- Admin tem SEMPRE tudo (a função can() força true para admin).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.role_permissions (
  role             text primary key check (role in ('admin','lideranca','time')),
  create_task      boolean not null default false,
  move_task        boolean not null default true,
  manage_users     boolean not null default false,
  manage_resources boolean not null default false
);

-- Defaults: admin e liderança gerem tudo; Time executa e move.
insert into public.role_permissions (role, create_task, move_task, manage_users, manage_resources) values
  ('admin',     true,  true,  true,  true),
  ('lideranca', true,  true,  true,  true),
  ('time',      false, true,  false, false)
on conflict (role) do nothing;

-- A linha do admin é sempre "tudo true" (defensivo, mesmo que editem por engano).
update public.role_permissions
  set create_task = true, move_task = true, manage_users = true, manage_resources = true
  where role = 'admin';

-- ----------------------------------------------------------------------------
-- Helper: a pessoa logada tem a capacidade `cap`? (admin sempre true)
-- ----------------------------------------------------------------------------
create or replace function public.can(cap text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when (select role from public.profiles where id = auth.uid()) = 'admin' then true
    else coalesce(
      (select case cap
         when 'create_task'      then create_task
         when 'move_task'        then move_task
         when 'manage_users'     then manage_users
         when 'manage_resources' then manage_resources
         else false
       end
       from public.role_permissions
       where role = (select role from public.profiles where id = auth.uid())),
      false)
  end;
$$;

-- ----------------------------------------------------------------------------
-- RLS da própria tabela: todos leem; só quem gere usuários edita a matriz.
-- ----------------------------------------------------------------------------
alter table public.role_permissions enable row level security;

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions for select to authenticated
  using (true);

drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions for all to authenticated
  using (public.can('manage_users')) with check (public.can('manage_users'));

grant select, insert, update, delete on public.role_permissions to authenticated;
grant select, insert, update, delete on public.role_permissions to service_role;

-- ----------------------------------------------------------------------------
-- Reescreve as policies de escrita para usar as capacidades.
-- ----------------------------------------------------------------------------

-- TAREFAS: criar/excluir = create_task; mover/atualizar = move_task.
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.can('create_task'));

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
  using (public.can('move_task')) with check (public.can('move_task'));

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.can('create_task'));

-- USUÁRIOS (profiles): gestão = manage_users (o self-update continua valendo).
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.can('manage_users')) with check (public.can('manage_users'));

-- RECURSOS: clientes, mídia, credenciais e agenda = manage_resources.
drop policy if exists clients_admin_write on public.clients;
create policy clients_admin_write on public.clients for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists media_admin_write on public.client_media;
create policy media_admin_write on public.client_media for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists cred_admin_all on public.client_credentials;
create policy cred_admin_all on public.client_credentials for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists agenda_admin_write on public.agenda_events;
create policy agenda_admin_write on public.agenda_events for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

-- Entrega ao vivo das mudanças da matriz (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'role_permissions'
  ) then
    alter publication supabase_realtime add table public.role_permissions;
  end if;
end $$;

-- >>>>>>>>>>>>>>>>>>>> 0011_editorial.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — calendário editorial no Supabase (antes em localStorage)
-- ----------------------------------------------------------------------------
-- Passa as postagens para o banco, compartilhadas por todo o time. Todos leem;
-- quem tem "gerir recursos" (can manage_resources) cria/edita/exclui. Inclui o
-- seed das postagens atuais da Anju (só insere se a tabela estiver vazia).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.editorial_posts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  date       date not null,
  title      text not null default '',
  format     text not null default 'carrossel'
             check (format in ('carrossel','reels','corte','imagem')),
  channels   text[] not null default '{}',
  stage      text not null default 'para-designer'
             check (stage in ('para-designer','para-edicao','para-anju','concluido')),
  approval   text not null default 'em-producao'
             check (approval in ('em-producao','em-revisao','aprovado','reprovado')),
  comment    text,
  upload_url text,
  cta        text,
  pending    text[] not null default '{}',
  ready      text[] not null default '{}',
  cards      jsonb  not null default '[]'::jsonb,
  assignee   uuid references public.profiles(id) on delete set null,
  task_id    uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists editorial_client_date_idx
  on public.editorial_posts (client_id, date);

alter table public.editorial_posts enable row level security;

drop policy if exists editorial_select on public.editorial_posts;
create policy editorial_select on public.editorial_posts for select to authenticated
  using (true);

drop policy if exists editorial_write on public.editorial_posts;
create policy editorial_write on public.editorial_posts for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

grant select, insert, update, delete on public.editorial_posts to authenticated;
grant select, insert, update, delete on public.editorial_posts to service_role;

-- Entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'editorial_posts'
  ) then
    alter publication supabase_realtime add table public.editorial_posts;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed das postagens atuais da Anju (só se ainda não houver nenhuma).
-- ----------------------------------------------------------------------------
do $$
declare anju uuid := 'a0000000-0000-4000-8000-000000000c06';
begin
  if not exists (select 1 from public.editorial_posts where client_id = anju) then
    insert into public.editorial_posts (client_id, date, title, format, channels, stage, approval, comment, cta, pending, ready, cards) values
      (anju,'2026-06-12','Corte | Construção Real','corte',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,edicao}','[]'::jsonb),
      (anju,'2026-06-13','Carrossel | Tipos de Falha','carrossel',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-14','Carrossel | Consistência','carrossel',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-15','Corte | Aula | A Pergunta que Muda Tudo','corte',array['instagram'],'para-edicao','em-producao',null,null,'{edicao}','{copy,roteiro}','[]'::jsonb),
      (anju,'2026-06-16','Corte | YouTube | Corpo Perfeito','corte',array['youtube'],'para-edicao','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb),
      (anju,'2026-06-17','Carrossel | Ter Tudo e Se Sentir Vazia','carrossel',array['instagram'],'para-anju','em-revisao','Ajustar o tom do card 3 — está duro demais.',null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-18','Carrossel | Erro Invisível','carrossel',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy,legenda}','[]'::jsonb),
      (anju,'2026-06-19','Carrossel | Sensualidade Romantizada','carrossel',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-20','Reels | Falha Muscular | Corte 1','reels',array['instagram'],'para-anju','em-revisao',null,null,'{}','{copy,legenda,edicao}','[]'::jsonb),
      (anju,'2026-06-21','Carrossel | Falha Muscular','carrossel',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy,legenda}','[]'::jsonb),
      (anju,'2026-06-22','Carrossel | Mais ou Melhor','carrossel',array['instagram'],'para-designer','em-producao',null,'Comenta "TÉCNICA" que eu te mando o guia de execução.','{imagens}','{copy,legenda}',
        jsonb_build_array(
          jsonb_build_object('id','c1','text','Treinar Mais ou Treinar Melhor?'),
          jsonb_build_object('id','c2','text','Você é constante. A frequência é impecável. E mesmo assim o resultado custa a aparecer.'),
          jsonb_build_object('id','c3','text','A resposta do mercado é sempre a mesma: capricha mais. Mais carga, mais série, mais sacrifício. Como se a culpa fosse sua.'),
          jsonb_build_object('id','c4','text','Mas esforço sem técnica não vira músculo. Vira desgaste. Escorre para o balanço, para a articulação errada, para longe do que você quer fortalecer.'),
          jsonb_build_object('id','c5','text','O seu treino não para por falta de esforço. Para por falta de prescrição feita para o seu corpo. Técnica não é perfeccionismo: é respeito por quem você é.'),
          jsonb_build_object('id','c6','text','Alguém já te falou que "é só treinar mais"?')
        )),
      (anju,'2026-06-23','Reels | Falha Muscular | Corte 2','reels',array['instagram'],'para-designer','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb),
      (anju,'2026-06-24','Carrossel | Falha Muscular | Técnica','carrossel',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy}','[]'::jsonb),
      (anju,'2026-06-25','Reels | Falha Muscular | Corte 3','reels',array['instagram'],'para-edicao','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb),
      (anju,'2026-06-26','Imagem | Motivação','imagem',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy}','[]'::jsonb),
      (anju,'2026-06-27','Reels | Falha Muscular | Corte 4','reels',array['instagram'],'para-edicao','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb);
  end if;
end $$;

-- >>>>>>>>>>>>>>>>>>>> 0012_comments.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — comentários / discussão (polimórfico)
-- ----------------------------------------------------------------------------
-- Uma só tabela serve tarefas e editorial (e o que vier): a referência é
-- (entity_type, entity_id). Todos leem e comentam; cada um edita/apaga o
-- próprio comentário; gestores (can manage_users) moderam qualquer um.
-- Gatilhos limpam os comentários quando a tarefa/post é excluída.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('task','editorial')),
  entity_id   uuid not null,
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_entity_idx
  on public.comments (entity_type, entity_id, created_at);

alter table public.comments enable row level security;

-- Todos os autenticados leem.
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select to authenticated
  using (true);

-- Só cria como si mesmo (author_id = quem está logado).
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid());

-- Edita o próprio comentário.
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Apaga o próprio; gestores (manage_users) moderam qualquer um.
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.can('manage_users'));

grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.comments to service_role;

-- ----------------------------------------------------------------------------
-- Limpeza: ao excluir a entidade, remove os comentários órfãos. (Referência
-- polimórfica não tem FK, então cuidamos por gatilho.)
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.comments
   where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end $$;

drop trigger if exists cleanup_task_comments on public.tasks;
create trigger cleanup_task_comments
  after delete on public.tasks
  for each row execute function public.cleanup_comments('task');

drop trigger if exists cleanup_editorial_comments on public.editorial_posts;
create trigger cleanup_editorial_comments
  after delete on public.editorial_posts
  for each row execute function public.cleanup_comments('editorial');

-- Entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;

-- >>>>>>>>>>>>>>>>>>>> 0013_attachments.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — anexos / arquivos (Supabase Storage + metadados)
-- ----------------------------------------------------------------------------
-- Cria o bucket PRIVADO "attachments" (download por signed URL) e uma tabela
-- polimórfica de metadados que serve tarefas e editorial — referência por
-- (entity_type, entity_id), no mesmo padrão dos comentários. Os arquivos vão
-- para storage.objects; aqui guardamos nome, tipo, tamanho e quem enviou.
-- Gatilhos limpam metadados E objetos quando a entidade é excluída.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------- BUCKET -----
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400)  -- 25 MB por arquivo
on conflict (id) do nothing;

-- Políticas do Storage para o bucket (time logado lê/sobe/remove; o controle
-- fino de quem pode remover fica na tabela de metadados abaixo).
drop policy if exists attachments_obj_read on storage.objects;
create policy attachments_obj_read on storage.objects for select to authenticated
  using (bucket_id = 'attachments');

drop policy if exists attachments_obj_insert on storage.objects;
create policy attachments_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');

drop policy if exists attachments_obj_delete on storage.objects;
create policy attachments_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'attachments');

-- ------------------------------------------------------------ METADADOS ------
create table if not exists public.attachments (
  id               uuid primary key default gen_random_uuid(),
  entity_type      text not null check (entity_type in ('task','editorial')),
  entity_id        uuid not null,
  bucket           text not null default 'attachments',
  path             text not null,        -- caminho do objeto no Storage
  name             text not null,        -- nome original do arquivo
  mime             text,
  size             bigint,
  uploaded_by      uuid references auth.users(id) on delete set null,
  uploaded_by_name text not null,
  created_at       timestamptz not null default now()
);

create index if not exists attachments_entity_idx
  on public.attachments (entity_type, entity_id, created_at);

alter table public.attachments enable row level security;

-- Todos os autenticados leem (e baixam).
drop policy if exists attachments_select on public.attachments;
create policy attachments_select on public.attachments for select to authenticated
  using (true);

-- Só registra como si mesmo.
drop policy if exists attachments_insert on public.attachments;
create policy attachments_insert on public.attachments for insert to authenticated
  with check (uploaded_by = auth.uid());

-- Remove o próprio; gestores (manage_users) moderam qualquer um.
drop policy if exists attachments_delete on public.attachments;
create policy attachments_delete on public.attachments for delete to authenticated
  using (uploaded_by = auth.uid() or public.can('manage_users'));

grant select, insert, update, delete on public.attachments to authenticated;
grant select, insert, update, delete on public.attachments to service_role;

-- ----------------------------------------------------------------------------
-- Limpeza: ao excluir a entidade, remove metadados E os objetos no Storage.
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_attachments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects o
   using public.attachments a
   where a.entity_type = tg_argv[0] and a.entity_id = old.id
     and o.bucket_id = a.bucket and o.name = a.path;
  delete from public.attachments
   where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end $$;

drop trigger if exists cleanup_task_attachments on public.tasks;
create trigger cleanup_task_attachments
  after delete on public.tasks
  for each row execute function public.cleanup_attachments('task');

drop trigger if exists cleanup_editorial_attachments on public.editorial_posts;
create trigger cleanup_editorial_attachments
  after delete on public.editorial_posts
  for each row execute function public.cleanup_attachments('editorial');

-- Entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'attachments'
  ) then
    alter publication supabase_realtime add table public.attachments;
  end if;
end $$;

-- >>>>>>>>>>>>>>>>>>>> 0014_task_review_from.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — guarda o responsável original durante a revisão
-- ----------------------------------------------------------------------------
-- Ao enviar uma tarefa para "Em revisão", os responsáveis passam a ser os
-- administradores (quem revisa). Para devolver a tarefa a quem executou ao
-- sair da revisão (voltar para A fazer/Em andamento ou concluir), guardamos
-- aqui os responsáveis de antes. Vazio fora da revisão.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.tasks
  add column if not exists review_from uuid[] not null default '{}';

-- >>>>>>>>>>>>>>>>>>>> 0015_attachments_cleanup_no_storage_delete.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — correção da limpeza de anexos ao excluir a entidade
-- ----------------------------------------------------------------------------
-- A versão anterior (0013) deletava direto de storage.objects dentro do gatilho.
-- O Supabase BLOQUEIA DELETE direto nessa tabela:
--   "Direct deletion from storage tables is not allowed. Use the Storage API."
-- Como o gatilho roda na MESMA transação do delete da tarefa/post, o erro
-- abortava tudo e a entidade NUNCA era excluída.
--
-- Correção: o gatilho passa a remover SÓ os metadados (public.attachments). Os
-- ARQUIVOS no Storage são removidos pelo client (Storage API) ANTES de excluir
-- a entidade. Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create or replace function public.cleanup_attachments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Apenas metadados. Os objetos no Storage são limpos pelo client (Storage API).
  delete from public.attachments
   where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end $$;

-- Os gatilhos cleanup_task_attachments / cleanup_editorial_attachments (0013) já
-- apontam para esta função — não precisam ser recriados.

-- >>>>>>>>>>>>>>>>>>>> 0016_catalogs.sql >>>>>>>>>>>>>>>>>>>>

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

-- >>>>>>>>>>>>>>>>>>>> 0017_editorial_description.sql >>>>>>>>>>>>>>>>>>>>

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

-- >>>>>>>>>>>>>>>>>>>> 0018_catalog_extra_tones.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — cores extras nos catálogos (além do design system)
-- ----------------------------------------------------------------------------
-- Amplia o conjunto de cores (tone) que um item de catálogo pode ter, incluindo
-- cores fora da paleta do design system (renderizadas com cor explícita na UI).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

alter table public.catalog_items drop constraint if exists catalog_items_tone_check;

alter table public.catalog_items
  add constraint catalog_items_tone_check
  check (tone in (
    'steel','sand','warning','danger','success','neutral',
    'blue','teal','purple','pink','orange','graphite'
  ));

-- >>>>>>>>>>>>>>>>>>>> 0019_credentials_read_all.sql >>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Central Anju — senhas das plataformas visíveis para todo o time
-- ----------------------------------------------------------------------------
-- O time também acessa as plataformas, então precisa LER as credenciais. Antes
-- a política era `cred_admin_all` (FOR ALL com manage_resources), o que bloqueava
-- a leitura para quem não gere recursos. Agora: leitura para todo autenticado;
-- criar/editar/excluir continua restrito a quem tem manage_resources.
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

drop policy if exists cred_admin_all on public.client_credentials;

drop policy if exists cred_select on public.client_credentials;
create policy cred_select on public.client_credentials for select to authenticated
  using (true);

drop policy if exists cred_insert on public.client_credentials;
create policy cred_insert on public.client_credentials for insert to authenticated
  with check (public.can('manage_resources'));

drop policy if exists cred_update on public.client_credentials;
create policy cred_update on public.client_credentials for update to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

drop policy if exists cred_delete on public.client_credentials;
create policy cred_delete on public.client_credentials for delete to authenticated
  using (public.can('manage_resources'));
