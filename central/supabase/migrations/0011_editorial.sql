-- ============================================================================
-- Central Anju — calendário editorial no Supabase (antes em localStorage)
-- ----------------------------------------------------------------------------
-- Passa as postagens para o banco, compartilhadas por todo o time. Todos leem;
-- quem tem "gerir recursos" (can manage_resources) cria/edita/exclui. Inclui o
-- seed das postagens atuais da Anju (só insere se a tabela estiver vazia).
-- Rode inteiro no SQL Editor → Run. Idempotente.
-- ============================================================================

create table if not exists public.editorial_posts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  date       date not null,
  title      text not null default '',
  format     text not null default 'carrossel'
             check (format in ('carrossel','reels','corte','imagem')),
  channels   text[] not null default '{}',
  stage      text not null default 'para-designer'
             check (stage in ('para-designer','para-edicao','para-anju','concluido')),
  approval   text not null default 'em-producao'
             check (approval in ('em-producao','em-revisao','aprovado','reprovado')),
  comment    text,
  upload_url text,
  cta        text,
  pending    text[] not null default '{}',
  ready      text[] not null default '{}',
  cards      jsonb  not null default '[]'::jsonb,
  assignee   uuid references public.profiles(id) on delete set null,
  task_id    uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists editorial_client_date_idx
  on public.editorial_posts (client_id, date);

alter table public.editorial_posts enable row level security;

drop policy if exists editorial_select on public.editorial_posts;
create policy editorial_select on public.editorial_posts for select to authenticated
  using (true);

drop policy if exists editorial_write on public.editorial_posts;
create policy editorial_write on public.editorial_posts for all to authenticated
  using (public.can('manage_resources')) with check (public.can('manage_resources'));

grant select, insert, update, delete on public.editorial_posts to authenticated;
grant select, insert, update, delete on public.editorial_posts to service_role;

-- Entrega ao vivo (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'editorial_posts'
  ) then
    alter publication supabase_realtime add table public.editorial_posts;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed das postagens atuais da Anju (só se ainda não houver nenhuma).
-- ----------------------------------------------------------------------------
do $$
declare anju uuid := 'a0000000-0000-4000-8000-000000000c06';
begin
  if not exists (select 1 from public.editorial_posts where client_id = anju) then
    insert into public.editorial_posts (client_id, date, title, format, channels, stage, approval, comment, cta, pending, ready, cards) values
      (anju,'2026-06-12','Corte | Construção Real','corte',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,edicao}','[]'::jsonb),
      (anju,'2026-06-13','Carrossel | Tipos de Falha','carrossel',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-14','Carrossel | Consistência','carrossel',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-15','Corte | Aula | A Pergunta que Muda Tudo','corte',array['instagram'],'para-edicao','em-producao',null,null,'{edicao}','{copy,roteiro}','[]'::jsonb),
      (anju,'2026-06-16','Corte | YouTube | Corpo Perfeito','corte',array['youtube'],'para-edicao','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb),
      (anju,'2026-06-17','Carrossel | Ter Tudo e Se Sentir Vazia','carrossel',array['instagram'],'para-anju','em-revisao','Ajustar o tom do card 3 — está duro demais.',null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-18','Carrossel | Erro Invisível','carrossel',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy,legenda}','[]'::jsonb),
      (anju,'2026-06-19','Carrossel | Sensualidade Romantizada','carrossel',array['instagram'],'concluido','aprovado',null,null,'{}','{copy,legenda,imagens}','[]'::jsonb),
      (anju,'2026-06-20','Reels | Falha Muscular | Corte 1','reels',array['instagram'],'para-anju','em-revisao',null,null,'{}','{copy,legenda,edicao}','[]'::jsonb),
      (anju,'2026-06-21','Carrossel | Falha Muscular','carrossel',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy,legenda}','[]'::jsonb),
      (anju,'2026-06-22','Carrossel | Mais ou Melhor','carrossel',array['instagram'],'para-designer','em-producao',null,'Comenta "TÉCNICA" que eu te mando o guia de execução.','{imagens}','{copy,legenda}',
        jsonb_build_array(
          jsonb_build_object('id','c1','text','Treinar Mais ou Treinar Melhor?'),
          jsonb_build_object('id','c2','text','Você é constante. A frequência é impecável. E mesmo assim o resultado custa a aparecer.'),
          jsonb_build_object('id','c3','text','A resposta do mercado é sempre a mesma: capricha mais. Mais carga, mais série, mais sacrifício. Como se a culpa fosse sua.'),
          jsonb_build_object('id','c4','text','Mas esforço sem técnica não vira músculo. Vira desgaste. Escorre para o balanço, para a articulação errada, para longe do que você quer fortalecer.'),
          jsonb_build_object('id','c5','text','O seu treino não para por falta de esforço. Para por falta de prescrição feita para o seu corpo. Técnica não é perfeccionismo: é respeito por quem você é.'),
          jsonb_build_object('id','c6','text','Alguém já te falou que "é só treinar mais"?')
        )),
      (anju,'2026-06-23','Reels | Falha Muscular | Corte 2','reels',array['instagram'],'para-designer','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb),
      (anju,'2026-06-24','Carrossel | Falha Muscular | Técnica','carrossel',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy}','[]'::jsonb),
      (anju,'2026-06-25','Reels | Falha Muscular | Corte 3','reels',array['instagram'],'para-edicao','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb),
      (anju,'2026-06-26','Imagem | Motivação','imagem',array['instagram'],'para-designer','em-producao',null,null,'{imagens}','{copy}','[]'::jsonb),
      (anju,'2026-06-27','Reels | Falha Muscular | Corte 4','reels',array['instagram'],'para-edicao','em-producao',null,null,'{edicao}','{roteiro}','[]'::jsonb);
  end if;
end $$;
