-- ============================================================================
-- CRM — captura pública da Lista de Espera (landing /lista-de-espera)
-- ----------------------------------------------------------------------------
-- A nova página de lista de espera (design-system, rota /lista-de-espera)
-- grava o lead direto no CRM da Central, sem passar pelo WordPress.
-- Como a landing é pública (visitante anônimo), a escrita acontece por uma
-- função SECURITY DEFINER exposta ao role `anon` — o RLS do crm_leads
-- continua fechado para anônimos; a função é a única porta de entrada.
--
--   1) Novo item no catálogo crm_origin: "Lista de Espera"
--   2) Função public.lista_espera_signup(nome, email, whatsapp)
--        · valida/normaliza os campos (limites de tamanho, formato de e-mail)
--        · dedupe: se já existe lead com o mesmo e-mail ou WhatsApp, apenas
--          registra a nova tentativa nas observações (não duplica card)
--        · insere com origin='Lista de Espera', status='Novo'
--
-- Aditivo e idempotente. Rode inteiro no SQL Editor → Run.
-- ============================================================================

-- ---- 1) Origem no catálogo ---------------------------------------------------
-- tone 'warning' (âmbar) — 'gold' não existe no check do catálogo (0018).
insert into public.catalog_items (catalog, value, label, tone, sort)
select 'crm_origin', 'Lista de Espera', 'Lista de Espera', 'warning', 10
where not exists (
  select 1 from public.catalog_items
   where catalog = 'crm_origin' and value = 'Lista de Espera'
);

-- ---- 2) Função de captura (anon) --------------------------------------------
create or replace function public.lista_espera_signup(
  p_name     text,
  p_email    text,
  p_whatsapp text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name     text := left(btrim(coalesce(p_name, '')), 120);
  v_email    text := left(lower(btrim(coalesce(p_email, ''))), 160);
  v_whatsapp text := left(btrim(coalesce(p_whatsapp, '')), 40);
  v_digits   text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_existing uuid;
begin
  -- Validações mínimas — a landing já valida, isto é a rede de segurança.
  if length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'nome');
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;
  if length(v_digits) < 10 then
    return jsonb_build_object('ok', false, 'error', 'whatsapp');
  end if;

  -- Dedupe por e-mail ou WhatsApp (só dígitos) — não duplica card no kanban.
  select id into v_existing
    from public.crm_leads
   where (email is not null and lower(email) = v_email)
      or (whatsapp is not null
          and regexp_replace(whatsapp, '\D', '', 'g') = v_digits)
   order by created_at desc
   limit 1;

  if v_existing is not null then
    update public.crm_leads
       set notes = coalesce(notes || E'\n', '')
                   || 'Reinscrição na lista de espera em '
                   || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
     where id = v_existing;
    return jsonb_build_object('ok', true, 'duplicated', true);
  end if;

  insert into public.crm_leads (name, email, whatsapp, origin, status, notes)
  values (
    v_name, v_email, v_whatsapp,
    'Lista de Espera', 'Novo',
    'Entrou pela página de lista de espera em '
      || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
  );

  return jsonb_build_object('ok', true, 'duplicated', false);
end $$;

-- Só a função é pública; a tabela continua protegida pelo RLS.
revoke all on function public.lista_espera_signup(text, text, text) from public;
grant execute on function public.lista_espera_signup(text, text, text) to anon, authenticated;
