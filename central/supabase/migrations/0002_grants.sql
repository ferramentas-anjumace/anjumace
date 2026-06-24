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
