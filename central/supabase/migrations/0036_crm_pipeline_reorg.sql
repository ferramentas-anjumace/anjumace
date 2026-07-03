-- ============================================================================
-- Central Anju — CRM: reorganização do pipeline (checkpoint 2026-07-03)
-- ----------------------------------------------------------------------------
-- Pedidos do Gabriel Mesquita na demo ao vivo do CRM (00:43–00:45):
--   • Nova etapa "Primeira mensagem enviada" entre "Novo" e a conexão
--     (Novo = base ainda sem contato; Primeira mensagem = já recebeu contato).
--   • Renomear "Em andamento" → "Conexão" (a pessoa respondeu ao menos 1 msg).
--   • Juntar "Proposta enviada" + "Negociação" numa etapa "Proposta / Negociação"
--     ("viu a proposta, está negociando" — é o mesmo momento).
--   • Manter "Aguardando resposta", "Fechado - Ganho/Perdido" e "Inativo".
-- E do Gabriel sobre origem (00:37): a base é de consultoria — falta a opção
-- "Consultoria" em crm_origin (origem = de onde veio; "Everfit" já existe).
--
-- IMPORTANTE: os KPIs do Dashboard identificam ganho/perdido/inativo pelo TEXTO
-- do status (regex /ganho|perdid|inativ/i). Os nomes novos NÃO contêm essas
-- palavras, então continuam contando como "ativos" — comportamento correto.
--
-- Como crm_leads.status guarda o texto do status (não é FK), primeiro migramos
-- os leads existentes e só depois removemos/renomeamos os itens do catálogo,
-- para não deixar nenhum lead apontando para uma etapa inexistente.
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Remapeia os leads existentes para as etapas novas --------------------
update public.crm_leads
   set status = 'Conexão'
 where status = 'Em andamento';

update public.crm_leads
   set status = 'Proposta / Negociação'
 where status in ('Proposta enviada', 'Negociação');

-- ---- 2) Remove os itens de catálogo renomeados/fundidos ----------------------
delete from public.catalog_items
 where catalog = 'crm_status'
   and value in ('Em andamento', 'Proposta enviada', 'Negociação');

-- ---- 3) Upsert do conjunto completo de etapas (ordem + tom corretos) ---------
insert into public.catalog_items (catalog, value, label, tone, sort) values
  ('crm_status','Novo','Novo','blue',0),
  ('crm_status','Primeira mensagem enviada','Primeira mensagem enviada','steel',1),
  ('crm_status','Conexão','Conexão','teal',2),
  ('crm_status','Aguardando resposta','Aguardando resposta','warning',3),
  ('crm_status','Proposta / Negociação','Proposta / Negociação','purple',4),
  ('crm_status','Fechado - Ganho','Fechado - Ganho','success',5),
  ('crm_status','Fechado - Perdido','Fechado - Perdido','danger',6),
  ('crm_status','Inativo','Inativo','neutral',7)
on conflict (catalog, value) do update
  set label = excluded.label,
      tone  = excluded.tone,
      sort  = excluded.sort,
      active = true;

-- ---- 4) Origem "Consultoria" (base importada do Everfit/consultoria) ---------
-- Entra logo antes de "Outro", que passa a ser o último da lista.
insert into public.catalog_items (catalog, value, label, tone, sort) values
  ('crm_origin','Consultoria','Consultoria','sand',9)
on conflict (catalog, value) do update
  set sort = 9, active = true;

update public.catalog_items
   set sort = 10
 where catalog = 'crm_origin' and value = 'Outro';
