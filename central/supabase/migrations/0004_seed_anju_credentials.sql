-- ============================================================================
-- Central UpSkl — acessos da Anju Mace (39 plataformas)
-- ----------------------------------------------------------------------------
-- Substitui os acessos de exemplo pelos 39 reais (senhas como placeholder
-- "••••••••" — troque pelas reais depois, pela própria central).
-- Rode inteiro no SQL Editor → Run. Idempotente: limpa antes de inserir.
-- ============================================================================

delete from public.client_credentials
where client_id = 'a0000000-0000-4000-8000-000000000c06';

insert into public.client_credentials (client_id, platform, url, username, password, note, sort) values
  ('a0000000-0000-4000-8000-000000000c06','Circle','https://anju-mace.circle.so/','administrativo@anjumace.com.br','••••••••','Comunidade',1),
  ('a0000000-0000-4000-8000-000000000c06','Everfit','https://everfit.io/login','administrativo@anjumace.com.br','••••••••','Treinos',2),
  ('a0000000-0000-4000-8000-000000000c06','Salvy','https://app.salvy.com.br','administrativo@anjumace.com.br','••••••••','Telefonia',3),
  ('a0000000-0000-4000-8000-000000000c06','Stripe','https://dashboard.stripe.com','financeiro@anjumace.com.br','••••••••','Financeiro · MFA necessário',4),
  ('a0000000-0000-4000-8000-000000000c06','Zapier','https://zapier.com/app/login','administrativo@anjumace.com.br','••••••••','Automações',5),
  ('a0000000-0000-4000-8000-000000000c06','DevZap','https://app.devzap.com.br','administrativo@anjumace.com.br','••••••••','WhatsApp / automação',6),
  ('a0000000-0000-4000-8000-000000000c06','E-mail Admin','https://webmail.anjumace.com.br','administrativo@anjumace.com.br','••••••••','E-mail administrativo',7),
  ('a0000000-0000-4000-8000-000000000c06','Meta Ads','https://business.facebook.com','lucianasmac@gmail.com','••••••••','Conta de anúncios',8),
  ('a0000000-0000-4000-8000-000000000c06','Cademi','https://anjumace.cademi.com.br/dashboard/inicio','anjuinstag@gmail.com','••••••••','Área de membros',9),
  ('a0000000-0000-4000-8000-000000000c06','ManyChat','https://manychat.com','lucianasmac@gmail.com','••••••••','Logar com Facebook',10),
  ('a0000000-0000-4000-8000-000000000c06','Panda','https://dashboard.pandavideo.com.br','anjuinstag@gmail.com','••••••••','Hospedagem de vídeo',11),
  ('a0000000-0000-4000-8000-000000000c06','DevZapp','https://app.devzapp.com.br','anjuinstag@gmail.com','••••••••','WhatsApp / automação',12),
  ('a0000000-0000-4000-8000-000000000c06','Eduzz','https://www.eduzz.com','anjuinstag@gmail.com','••••••••','Pagamentos / produtos',13),
  ('a0000000-0000-4000-8000-000000000c06','Guru','https://app.digitalmanager.guru','—','—','Acesso administrativo pendente — solicitar liberação por e-mail',14),
  ('a0000000-0000-4000-8000-000000000c06','Instagram','https://instagram.com/anjumace','@anjumace','••••••••','Rede social',15),
  ('a0000000-0000-4000-8000-000000000c06','YouTube','https://youtube.com','administrativo@anjumace.com.br','••••••••','Rede social',16),
  ('a0000000-0000-4000-8000-000000000c06','TikTok','https://tiktok.com/@anjumace','@anjumace','••••••••','Rede social',17),
  ('a0000000-0000-4000-8000-000000000c06','Site (Admin)','https://www.anjumace.com.br/admin','admin','••••••••','Painel do site',18),
  ('a0000000-0000-4000-8000-000000000c06','Pinterest','https://pinterest.com','administrativo@anjumace.com.br','••••••••','Rede social',19),
  ('a0000000-0000-4000-8000-000000000c06','Cloudflare','https://dash.cloudflare.com','administrativo@anjumace.com.br','••••••••','DNS / CDN',20),
  ('a0000000-0000-4000-8000-000000000c06','TurboCloud','https://painel.turbocloud.com.br','anjuinstag@gmail.com','••••••••','Hospedagem do site anjumace.com.br',21),
  ('a0000000-0000-4000-8000-000000000c06','Panda Video','https://dashboard.pandavideo.com.br','anjuinstag@gmail.com','••••••••','Hospedagem de vídeo',22),
  ('a0000000-0000-4000-8000-000000000c06','WordPress','https://www.anjumace.com.br/wp-admin','admin','••••••••','Site (WP)',23),
  ('a0000000-0000-4000-8000-000000000c06','E-mail Suporte','https://webmail.anjumace.com.br','suporte@anjumace.com.br','••••••••','Suporte · +55 61 98144-7368',24),
  ('a0000000-0000-4000-8000-000000000c06','Typeform','https://admin.typeform.com','administrativo@anjumace.com.br','••••••••','Formulários',25),
  ('a0000000-0000-4000-8000-000000000c06','Nuclino','https://app.nuclino.com','contact@upskala.com','••••••••','Conta UpSkl · base de conhecimento',26),
  ('a0000000-0000-4000-8000-000000000c06','Alugamed Phone Tracker','','contact@upskala.com','••••••••','Conta UpSkl',27),
  ('a0000000-0000-4000-8000-000000000c06','Autentique','https://painel.autentique.com.br','contact@upskala.com','••••••••','Conta UpSkl · assinaturas',28),
  ('a0000000-0000-4000-8000-000000000c06','ClickUp','https://app.clickup.com','contact@upskala.com','••••••••','Conta UpSkl · gestão de tarefas',29),
  ('a0000000-0000-4000-8000-000000000c06','eSignatures','https://esignatures.com','contact@upskala.com','••••••••','Conta UpSkl · assinaturas',30),
  ('a0000000-0000-4000-8000-000000000c06','GoDaddy','https://godaddy.com','contact@upskala.com','••••••••','Conta UpSkl · domínios',31),
  ('a0000000-0000-4000-8000-000000000c06','Google','https://accounts.google.com','contact@upskala.com','••••••••','Conta UpSkl',32),
  ('a0000000-0000-4000-8000-000000000c06','Hotmart','https://app.hotmart.com','contact@upskala.com','••••••••','Conta UpSkl · produtos',33),
  ('a0000000-0000-4000-8000-000000000c06','Sprout Social','https://app.sproutsocial.com','contact@upskala.com','••••••••','Conta UpSkl · social',34),
  ('a0000000-0000-4000-8000-000000000c06','StayCloud','https://app.staycloud.com.br','contact@upskala.com','••••••••','Conta UpSkl · hospedagem',35),
  ('a0000000-0000-4000-8000-000000000c06','Meu Contador','https://app.meucontador.com.br','contact@upskala.com','••••••••','Conta UpSkl · contabilidade',36),
  ('a0000000-0000-4000-8000-000000000c06','n8n','https://n8n.io','contact@upskala.com','••••••••','Conta UpSkl · automações',37),
  ('a0000000-0000-4000-8000-000000000c06','Vimeo','https://vimeo.com','contact@upskala.com','••••••••','Conta UpSkl · vídeo',38),
  ('a0000000-0000-4000-8000-000000000c06','ActiveCampaign','https://anjumaceapp.activehosted.com','anjumaceapp','••••••••','E-mail marketing',39);
