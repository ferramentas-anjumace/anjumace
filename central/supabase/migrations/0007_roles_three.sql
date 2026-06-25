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
