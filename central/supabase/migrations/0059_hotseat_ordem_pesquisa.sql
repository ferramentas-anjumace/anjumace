-- ============================================================================
-- Hotseat "A Ordem" — respostas da pesquisa "leads core" (/aordem-captura)
-- ----------------------------------------------------------------------------
-- A pesquisa (pop-up de 4 telas depois da reserva) hoje só vai pro Active
-- Campaign (design-system/api/aordem-pesquisa-form.js). Guarda também no
-- Supabase, numa tabela própria (não mistura com hotseat_ordem_leads porque
-- a pesquisa é opcional/pode chegar depois, ou nunca — dedupe por e-mail,
-- reenvio atualiza as respostas em vez de duplicar).
--
--   1) Tabela public.hotseat_ordem_pesquisa (answers em jsonb, chave = id
--      da pergunta no Active Campaign, ex. "18", "31" — ver SURVEY_QUESTIONS
--      em AppAordemCaptura.jsx)
--   2) RPC public.hotseat_ordem_pesquisa_submit — única porta de escrita
--      pro anon
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

create table if not exists public.hotseat_ordem_pesquisa (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  phone         text,
  answers       jsonb not null default '{}'::jsonb,
  sms_consent   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hotseat_ordem_pesquisa_created_idx on public.hotseat_ordem_pesquisa (created_at desc);

alter table public.hotseat_ordem_pesquisa enable row level security;

-- Time autenticado lê; escrita/exclusão do time exige manage_crm (mesmo
-- gate usado em hotseat_ordem_leads).
drop policy if exists hotseat_ordem_pesquisa_select on public.hotseat_ordem_pesquisa;
create policy hotseat_ordem_pesquisa_select on public.hotseat_ordem_pesquisa for select to authenticated
  using (true);

drop policy if exists hotseat_ordem_pesquisa_update on public.hotseat_ordem_pesquisa;
create policy hotseat_ordem_pesquisa_update on public.hotseat_ordem_pesquisa for update to authenticated
  using (public.can('manage_crm')) with check (public.can('manage_crm'));

drop policy if exists hotseat_ordem_pesquisa_delete on public.hotseat_ordem_pesquisa;
create policy hotseat_ordem_pesquisa_delete on public.hotseat_ordem_pesquisa for delete to authenticated
  using (public.can('manage_crm'));

grant select, update, delete on public.hotseat_ordem_pesquisa to authenticated;
grant select, insert, update, delete on public.hotseat_ordem_pesquisa to service_role;

-- ---- RPC de captura (anon) ----------------------------------------------------
create or replace function public.hotseat_ordem_pesquisa_submit(
  p_email       text,
  p_name        text default null,
  p_phone       text default null,
  p_answers     jsonb default '{}'::jsonb,
  p_sms_consent boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := left(lower(btrim(coalesce(p_email, ''))), 160);
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;

  insert into public.hotseat_ordem_pesquisa (email, name, phone, answers, sms_consent)
  values (
    v_email,
    left(nullif(btrim(coalesce(p_name, '')), ''), 120),
    left(nullif(btrim(coalesce(p_phone, '')), ''), 40),
    coalesce(p_answers, '{}'::jsonb),
    coalesce(p_sms_consent, false)
  )
  on conflict (email) do update
    set answers     = excluded.answers,
        sms_consent = excluded.sms_consent,
        name        = coalesce(excluded.name, hotseat_ordem_pesquisa.name),
        phone       = coalesce(excluded.phone, hotseat_ordem_pesquisa.phone),
        updated_at  = now();

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.hotseat_ordem_pesquisa_submit(text, text, text, jsonb, boolean) from public;
grant execute on function public.hotseat_ordem_pesquisa_submit(text, text, text, jsonb, boolean) to anon, authenticated;
