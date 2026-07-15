-- ============================================================================
-- Acessos — ferramentas com 2FA, responsável, custo e economia
-- ----------------------------------------------------------------------------
-- Pedido (All Hands 2026-07-14): substituir a planilha de acessos. Cada
-- ferramenta passa a registrar:
--   • onde chega o código de verificação (2FA) — para centralizar no
--     Authenticator com o e-mail administrativo e eliminar o gargalo;
--   • responsável e quem tem acesso;
--   • custo mensal e status (ativa/cancelada) — canceladas somam o card de
--     "economia mensal" da Central.
--
-- Aditivo e idempotente: só adiciona colunas em client_credentials.
-- RLS não muda — leitura para o time, escrita com manage_resources.
-- Rode inteiro no SQL Editor → Run.
-- ============================================================================

alter table public.client_credentials
  add column if not exists owner_id     uuid references public.profiles (id) on delete set null,
  add column if not exists twofa        text not null default 'nenhum',
  add column if not exists monthly_cost numeric(10,2),
  add column if not exists status       text not null default 'ativa',
  add column if not exists member_ids   uuid[] not null default '{}';

comment on column public.client_credentials.owner_id     is 'Responsável pela ferramenta (profiles.id).';
comment on column public.client_credentials.twofa        is 'Onde chega o código 2FA: nenhum | authenticator | email_admin | email_pessoal | sms.';
comment on column public.client_credentials.monthly_cost is 'Custo mensal em R$ (null = gratuita).';
comment on column public.client_credentials.status       is 'ativa | cancelada — canceladas somam a economia mensal.';
comment on column public.client_credentials.member_ids   is 'Membros com acesso à ferramenta (profiles.id).';

-- Valores válidos de twofa/status garantidos por check constraints (drop+add
-- para permitir reexecução da migration sem erro).
alter table public.client_credentials drop constraint if exists client_credentials_twofa_check;
alter table public.client_credentials add constraint client_credentials_twofa_check
  check (twofa in ('nenhum', 'authenticator', 'email_admin', 'email_pessoal', 'sms'));

alter table public.client_credentials drop constraint if exists client_credentials_status_check;
alter table public.client_credentials add constraint client_credentials_status_check
  check (status in ('ativa', 'cancelada'));
