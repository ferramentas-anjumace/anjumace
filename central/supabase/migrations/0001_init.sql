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
