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
