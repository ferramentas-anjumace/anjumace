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
