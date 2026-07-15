-- ============================================================================
-- Acessos — senha restrita + log de visualização
-- ----------------------------------------------------------------------------
-- Antes, qualquer login válido da equipe conseguia ler TODAS as senhas via
-- API (a RLS de select era aberta e a coluna vinha junto). Agora:
--
--   1) A coluna password sai do SELECT do papel authenticated (privilégio de
--      coluna) — a listagem da UI continua funcionando, mas sem a senha.
--   2) A senha só sai pela função credential_password(id), que confere a
--      permissão (manage_resources, responsável ou quem está em "quem tem
--      acesso") e REGISTRA quem pediu em credential_access_log.
--   3) O log é visível só pra quem tem manage_resources (auditoria).
--
-- Escrita não muda: criar/editar credencial (inclusive senha) continua
-- exigindo manage_resources via RLS. Idempotente. Rode no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Privilégio de coluna: password fora do select --------------------------
revoke select on public.client_credentials from authenticated;
grant select (id, client_id, platform, url, username, note, sort,
              owner_id, twofa, monthly_cost, status, member_ids)
  on public.client_credentials to authenticated;

-- ---- 2) Log de visualização ---------------------------------------------------
create table if not exists public.credential_access_log (
  id            bigint generated always as identity primary key,
  credential_id uuid not null references public.client_credentials (id) on delete cascade,
  user_id       uuid references public.profiles (id) on delete set null,
  at            timestamptz not null default now()
);

create index if not exists credential_access_log_at_idx
  on public.credential_access_log (at desc);

alter table public.credential_access_log enable row level security;

-- Só gestores de recursos leem o log; ninguém insere direto (a função
-- SECURITY DEFINER abaixo é o único caminho de escrita).
drop policy if exists credential_access_log_select on public.credential_access_log;
create policy credential_access_log_select on public.credential_access_log
  for select to authenticated
  using (public.can('manage_resources'));

grant select on public.credential_access_log to authenticated;
grant select, insert on public.credential_access_log to service_role;

-- ---- 3) Função que entrega a senha (confere permissão + loga) ------------------
create or replace function public.credential_password(cred uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
begin
  select id, password, owner_id, member_ids
    into c
    from public.client_credentials
   where id = cred;

  if not found then
    raise exception 'Credencial não encontrada.';
  end if;

  if not (
    public.can('manage_resources')
    or c.owner_id = auth.uid()
    or auth.uid() = any(coalesce(c.member_ids, '{}'))
  ) then
    raise exception 'Sem permissão para ver esta senha — peça a quem gerencia os acessos.';
  end if;

  insert into public.credential_access_log (credential_id, user_id)
  values (cred, auth.uid());

  return c.password;
end $$;

revoke all on function public.credential_password(uuid) from public;
grant execute on function public.credential_password(uuid) to authenticated;
