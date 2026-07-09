-- ============================================================================
-- CS — alinhar o checklist aos marcos do Playbook de Onboarding
-- ----------------------------------------------------------------------------
-- "Playbook de Onboarding: Marcos de Chegada na Aliança" (time de CS, soft
-- open) define 5 marcos oficiais + a ação de boas-vindas da Fase 1:
--
--   0. Boas-vindas enviada        (ação do time, dia do acesso — Fase 1)
--   1. Login no Circle            (Audience → Manage audience)
--   2. Avaliação/Formulário       (Typeform; Templo = formulário simples,
--                                  Singular = avaliação com prazo)
--   3. Perfil completo            (Circle, aba Info)
--   4. Aplicativo baixado         (pergunta direta — sem painel)
--   5. Primeira Missão            (post fixado em Primeiros Passos)
--
-- Esta migration renomeia os passos da 0043 para os nomes do playbook,
-- adiciona o que faltava (Aplicativo baixado) e ajusta a ordem. Também
-- atualiza os checks já marcados (cs_case_checks.item guarda o texto).
-- Funciona tanto se a 0043 já rodou quanto se nunca rodou (upsert no final).
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Renomeia os passos existentes (catálogo + checks marcados) ------------
update public.catalog_items set value = 'Boas-vindas enviada', label = 'Boas-vindas enviada'
 where catalog = 'cs_checklist' and value = 'Acolhimento feito';
update public.cs_case_checks set item = 'Boas-vindas enviada'
 where item = 'Acolhimento feito';

update public.catalog_items set value = 'Login no Circle', label = 'Login no Circle'
 where catalog = 'cs_checklist' and value = 'Entrou na Circle';
update public.cs_case_checks set item = 'Login no Circle'
 where item = 'Entrou na Circle';

update public.catalog_items set value = 'Avaliação/Formulário preenchido', label = 'Avaliação/Formulário preenchido'
 where catalog = 'cs_checklist' and value = 'Formulário preenchido';
update public.cs_case_checks set item = 'Avaliação/Formulário preenchido'
 where item = 'Formulário preenchido';

update public.catalog_items set value = 'Primeira Missão (apresentação)', label = 'Primeira Missão (apresentação)'
 where catalog = 'cs_checklist' and value = 'Primeira missão concluída';
update public.cs_case_checks set item = 'Primeira Missão (apresentação)'
 where item = 'Primeira missão concluída';

-- ---- 2) Garante todos os passos na ordem do playbook ---------------------------
insert into public.catalog_items (catalog, value, label, tone, sort)
select v.catalog, v.value, v.label, v.tone, v.sort
from (values
  ('cs_checklist','Boas-vindas enviada','Boas-vindas enviada','teal',0),
  ('cs_checklist','Login no Circle','Login no Circle','blue',1),
  ('cs_checklist','Avaliação/Formulário preenchido','Avaliação/Formulário preenchido','steel',2),
  ('cs_checklist','Perfil completo','Perfil completo','success',3),
  ('cs_checklist','Aplicativo baixado','Aplicativo baixado','purple',4),
  ('cs_checklist','Primeira Missão (apresentação)','Primeira Missão (apresentação)','warning',5)
) as v(catalog, value, label, tone, sort)
where not exists (
  select 1 from public.catalog_items c
   where c.catalog = v.catalog and c.value = v.value
);

-- Reordena conforme o playbook (mesmo se os itens já existiam).
update public.catalog_items set sort = 0 where catalog = 'cs_checklist' and value = 'Boas-vindas enviada';
update public.catalog_items set sort = 1 where catalog = 'cs_checklist' and value = 'Login no Circle';
update public.catalog_items set sort = 2 where catalog = 'cs_checklist' and value = 'Avaliação/Formulário preenchido';
update public.catalog_items set sort = 3 where catalog = 'cs_checklist' and value = 'Perfil completo';
update public.catalog_items set sort = 4 where catalog = 'cs_checklist' and value = 'Aplicativo baixado';
update public.catalog_items set sort = 5 where catalog = 'cs_checklist' and value = 'Primeira Missão (apresentação)';
