/* ----------------------------------------------------------------------------
   Dados mock da Central (console genérico de operações). Tudo estático — só
   para dar vida às telas do design system.
---------------------------------------------------------------------------- */

import { ANJU_ID } from '@/lib/tenant'

export type UserStatus = 'ativo' | 'convidado' | 'suspenso'

export interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Operador' | 'Visualizador'
  team: string
  status: UserStatus
  lastActive: string
  sessions: number
}

export const STATUS_META: Record<
  UserStatus,
  { label: string; tone: 'success' | 'steel' | 'warning' | 'danger' | 'neutral' }
> = {
  ativo: { label: 'ativo', tone: 'success' },
  convidado: { label: 'convidado', tone: 'steel' },
  suspenso: { label: 'suspenso', tone: 'warning' },
}

export const USERS: User[] = [
  { id: 'USR-1042', name: 'Ana Lima', email: 'ana.lima@upskl.io', role: 'Admin', team: 'Plataforma', status: 'ativo', lastActive: 'há 4 min', sessions: 312 },
  { id: 'USR-1043', name: 'Bruno Sá', email: 'bruno.sa@upskl.io', role: 'Operador', team: 'Suporte', status: 'ativo', lastActive: 'há 22 min', sessions: 198 },
  { id: 'USR-1044', name: 'Carla Reis', email: 'carla.reis@upskl.io', role: 'Operador', team: 'Conteúdo', status: 'convidado', lastActive: 'pendente', sessions: 0 },
  { id: 'USR-1045', name: 'Diego Melo', email: 'diego.melo@upskl.io', role: 'Visualizador', team: 'Financeiro', status: 'suspenso', lastActive: 'há 9 dias', sessions: 47 },
  { id: 'USR-1046', name: 'Eva Nunes', email: 'eva.nunes@upskl.io', role: 'Admin', team: 'Plataforma', status: 'ativo', lastActive: 'há 1 h', sessions: 421 },
  { id: 'USR-1047', name: 'Felipe Rocha', email: 'felipe.rocha@upskl.io', role: 'Operador', team: 'Suporte', status: 'ativo', lastActive: 'há 3 h', sessions: 156 },
  { id: 'USR-1048', name: 'Gabi Souza', email: 'gabi.souza@upskl.io', role: 'Operador', team: 'Conteúdo', status: 'convidado', lastActive: 'pendente', sessions: 0 },
  { id: 'USR-1049', name: 'Hugo Pinto', email: 'hugo.pinto@upskl.io', role: 'Visualizador', team: 'Financeiro', status: 'ativo', lastActive: 'há 30 min', sessions: 88 },
  { id: 'USR-1050', name: 'Iris Castro', email: 'iris.castro@upskl.io', role: 'Operador', team: 'Plataforma', status: 'ativo', lastActive: 'há 5 h', sessions: 233 },
  { id: 'USR-1051', name: 'João Dias', email: 'joao.dias@upskl.io', role: 'Operador', team: 'Suporte', status: 'suspenso', lastActive: 'há 2 dias', sessions: 64 },
]

export interface Activity {
  id: string
  user: string
  action: string
  target: string
  time: string
  tone: 'steel' | 'success' | 'warning' | 'danger'
}

export const ACTIVITY: Activity[] = [
  { id: 'a1', user: 'Ana Lima', action: 'aprovou', target: 'integração Slack', time: 'há 4 min', tone: 'success' },
  { id: 'a2', user: 'Bruno Sá', action: 'editou', target: 'permissões · Suporte', time: 'há 22 min', tone: 'steel' },
  { id: 'a3', user: 'Sistema', action: 'sinalizou', target: 'pico de erros · API', time: 'há 1 h', tone: 'danger' },
  { id: 'a4', user: 'Eva Nunes', action: 'convidou', target: '2 membros · Conteúdo', time: 'há 2 h', tone: 'steel' },
  { id: 'a5', user: 'Sistema', action: 'agendou', target: 'manutenção · 02:00', time: 'há 3 h', tone: 'warning' },
]

export type ClientStatus = 'ativo' | 'onboarding' | 'pausado'

export interface Client {
  id: string
  name: string
  /** Área de atuação do cliente (ex.: "Saúde & fitness"). */
  segment: string
  /** Fase atual do projeto do cliente (ex.: "Onboarding"). */
  phase: string
  plan: string
  progress: number
  status: ClientStatus
  contact: string
  since: string
  seats: number
  /** Foto do cliente (data URL). Enviada pelo usuário; persiste no store. */
  avatar?: string
}

export const CLIENT_STATUS_META: Record<
  ClientStatus,
  { label: string; tone: 'success' | 'steel' | 'warning' }
> = {
  ativo: { label: 'ativo', tone: 'success' },
  onboarding: { label: 'onboarding', tone: 'steel' },
  pausado: { label: 'pausado', tone: 'warning' },
}

export const CLIENTS: Client[] = [
  { id: 'CLI-06', name: 'Anju Mace', segment: 'Personal trainer & nutricionista', phase: 'Soft opening', plan: 'Starter', progress: 42, status: 'ativo', contact: 'contato@anjumace.fit', since: 'jun 2026', seats: 2 },
]

export function getClient(id?: string) {
  return CLIENTS.find((c) => c.id === id)
}

/* ---- Banco de acessos do cliente -------------------------------------- */

export interface MediaLink {
  id: string
  label: string
  kind: 'imagens' | 'videos' | 'marca' | 'conteudos'
  url: string
  hint: string
}

export interface Credential {
  id: string
  platform: string
  url: string
  username: string
  password: string
  note: string
}

export interface ClientResources {
  media: MediaLink[]
  credentials: Credential[]
}

const CLIENT_RESOURCES: Record<string, ClientResources> = {
  'CLI-06': {
    media: [
      { id: 'm1', label: 'Banco de imagens', kind: 'imagens', url: 'https://drive.google.com/anjumace/imagens', hint: 'Google Drive · fotos e artes' },
      { id: 'm2', label: 'Banco de vídeos', kind: 'videos', url: 'https://drive.google.com/anjumace/videos', hint: 'Google Drive · reels e bastidores' },
      { id: 'm3', label: 'Identidade visual', kind: 'marca', url: 'https://figma.com/anjumace/brand', hint: 'Figma · logo, cores e tipografia' },
      { id: 'm4', label: 'Banco de conteúdos', kind: 'conteudos', url: 'https://notion.so/anjumace/conteudos', hint: 'Notion · biblioteca de conteúdos' },
    ],
    credentials: [
      // Senhas reais removidas do código (segurança). Em produção viriam
      // cifradas do back-end; na demo o valor é apenas um placeholder.
      // — Contas Anju Mace —
      { id: 'cr1', platform: 'Circle', url: 'https://anju-mace.circle.so/', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'Comunidade' },
      { id: 'cr2', platform: 'Everfit', url: 'https://everfit.io/login', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'Treinos' },
      { id: 'cr3', platform: 'Salvy', url: 'https://app.salvy.com.br', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'Telefonia' },
      { id: 'cr4', platform: 'Stripe', url: 'https://dashboard.stripe.com', username: 'financeiro@anjumace.com.br', password: '••••••••', note: 'Financeiro · MFA necessário' },
      { id: 'cr5', platform: 'Zapier', url: 'https://zapier.com/app/login', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'Automações' },
      { id: 'cr6', platform: 'DevZap', url: 'https://app.devzap.com.br', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'WhatsApp / automação' },
      { id: 'cr7', platform: 'E-mail Admin', url: 'https://webmail.anjumace.com.br', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'E-mail administrativo' },
      { id: 'cr8', platform: 'Meta Ads', url: 'https://business.facebook.com', username: 'lucianasmac@gmail.com', password: '••••••••', note: 'Conta de anúncios' },
      { id: 'cr9', platform: 'Cademi', url: 'https://anjumace.cademi.com.br/dashboard/inicio', username: 'anjuinstag@gmail.com', password: '••••••••', note: 'Área de membros' },
      { id: 'cr10', platform: 'ManyChat', url: 'https://manychat.com', username: 'lucianasmac@gmail.com', password: '••••••••', note: 'Logar com Facebook' },
      { id: 'cr11', platform: 'Panda', url: 'https://dashboard.pandavideo.com.br', username: 'anjuinstag@gmail.com', password: '••••••••', note: 'Hospedagem de vídeo' },
      { id: 'cr12', platform: 'DevZapp', url: 'https://app.devzapp.com.br', username: 'anjuinstag@gmail.com', password: '••••••••', note: 'WhatsApp / automação' },
      { id: 'cr13', platform: 'Eduzz', url: 'https://www.eduzz.com', username: 'anjuinstag@gmail.com', password: '••••••••', note: 'Pagamentos / produtos' },
      { id: 'cr14', platform: 'Guru', url: 'https://app.digitalmanager.guru', username: '—', password: '—', note: 'Acesso administrativo pendente — solicitar liberação por e-mail' },
      { id: 'cr15', platform: 'Instagram', url: 'https://instagram.com/anjumace', username: '@anjumace', password: '••••••••', note: 'Rede social' },
      { id: 'cr16', platform: 'YouTube', url: 'https://youtube.com', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'Rede social' },
      { id: 'cr17', platform: 'TikTok', url: 'https://tiktok.com/@anjumace', username: '@anjumace', password: '••••••••', note: 'Rede social' },
      { id: 'cr18', platform: 'Site (Admin)', url: 'https://www.anjumace.com.br/admin', username: 'admin', password: '••••••••', note: 'Painel do site' },
      { id: 'cr19', platform: 'Pinterest', url: 'https://pinterest.com', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'Rede social' },
      { id: 'cr20', platform: 'Cloudflare', url: 'https://dash.cloudflare.com', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'DNS / CDN' },
      { id: 'cr21', platform: 'TurboCloud', url: 'https://painel.turbocloud.com.br', username: 'anjuinstag@gmail.com', password: '••••••••', note: 'Hospedagem do site anjumace.com.br' },
      { id: 'cr22', platform: 'Panda Video', url: 'https://dashboard.pandavideo.com.br', username: 'anjuinstag@gmail.com', password: '••••••••', note: 'Hospedagem de vídeo' },
      { id: 'cr23', platform: 'WordPress', url: 'https://www.anjumace.com.br/wp-admin', username: 'admin', password: '••••••••', note: 'Site (WP)' },
      { id: 'cr24', platform: 'E-mail Suporte', url: 'https://webmail.anjumace.com.br', username: 'suporte@anjumace.com.br', password: '••••••••', note: 'Suporte · +55 61 98144-7368' },
      { id: 'cr25', platform: 'Typeform', url: 'https://admin.typeform.com', username: 'administrativo@anjumace.com.br', password: '••••••••', note: 'Formulários' },
      // — Contas UpSkl (contact@upskala.com) —
      { id: 'cr26', platform: 'Nuclino', url: 'https://app.nuclino.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · base de conhecimento' },
      { id: 'cr27', platform: 'Alugamed Phone Tracker', url: '', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl' },
      { id: 'cr28', platform: 'Autentique', url: 'https://painel.autentique.com.br', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · assinaturas' },
      { id: 'cr29', platform: 'ClickUp', url: 'https://app.clickup.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · gestão de tarefas' },
      { id: 'cr30', platform: 'eSignatures', url: 'https://esignatures.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · assinaturas' },
      { id: 'cr31', platform: 'GoDaddy', url: 'https://godaddy.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · domínios' },
      { id: 'cr32', platform: 'Google', url: 'https://accounts.google.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl' },
      { id: 'cr33', platform: 'Hotmart', url: 'https://app.hotmart.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · produtos' },
      { id: 'cr34', platform: 'Sprout Social', url: 'https://app.sproutsocial.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · social' },
      { id: 'cr35', platform: 'StayCloud', url: 'https://app.staycloud.com.br', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · hospedagem' },
      { id: 'cr36', platform: 'Meu Contador', url: 'https://app.meucontador.com.br', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · contabilidade' },
      { id: 'cr37', platform: 'n8n', url: 'https://n8n.io', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · automações' },
      { id: 'cr38', platform: 'Vimeo', url: 'https://vimeo.com', username: 'contact@upskala.com', password: '••••••••', note: 'Conta UpSkl · vídeo' },
      { id: 'cr39', platform: 'ActiveCampaign', url: 'https://anjumaceapp.activehosted.com', username: 'anjumaceapp', password: '••••••••', note: 'E-mail marketing' },
    ],
  },
}

export function getResources(id?: string): ClientResources | undefined {
  return id ? CLIENT_RESOURCES[id] : undefined
}

/* ---- Calendário editorial --------------------------------------------- */

type Tone = 'neutral' | 'steel' | 'sand' | 'success' | 'danger' | 'warning'

/** Formato do criativo. */
export type EditorialFormat = 'carrossel' | 'reels' | 'corte' | 'imagem'
/** Canal de publicação (mídia social). */
export type EditorialChannel = 'instagram' | 'youtube' | 'tiktok' | 'blog' | 'email'
/** Etapa do fluxo de produção ("Enviar" — para quem está a bola). */
export type EditorialStage = 'para-designer' | 'para-edicao' | 'para-anju' | 'concluido'
/** Status de aprovação da cliente ("Aprovação Anju"). */
export type EditorialApproval = 'em-producao' | 'em-revisao' | 'aprovado' | 'reprovado'
/** Itens de checklist usados em "Falta o quê?" e "O que está pronto". */
export type EditorialAsset = 'copy' | 'legenda' | 'imagens' | 'edicao' | 'roteiro' | 'cta'

export const FORMAT_META: Record<EditorialFormat, { label: string; tone: Tone }> = {
  carrossel: { label: 'Carrossel', tone: 'sand' },
  reels: { label: 'Reels', tone: 'steel' },
  corte: { label: 'Corte', tone: 'neutral' },
  imagem: { label: 'Imagem', tone: 'warning' },
}

export const CHANNEL_META: Record<EditorialChannel, { label: string; tone: Tone }> = {
  instagram: { label: 'Instagram', tone: 'steel' },
  youtube: { label: 'YouTube', tone: 'danger' },
  tiktok: { label: 'TikTok', tone: 'neutral' },
  blog: { label: 'Blog', tone: 'neutral' },
  email: { label: 'E-mail', tone: 'neutral' },
}

export const STAGE_META: Record<EditorialStage, { label: string; tone: Tone }> = {
  'para-designer': { label: 'Design', tone: 'steel' },
  'para-edicao': { label: 'Edição de vídeo', tone: 'warning' },
  'para-anju': { label: 'Anju', tone: 'danger' },
  concluido: { label: 'Concluído', tone: 'success' },
}

export const APPROVAL_META: Record<EditorialApproval, { label: string; tone: Tone }> = {
  'em-producao': { label: 'Em produção', tone: 'warning' },
  'em-revisao': { label: 'Em revisão', tone: 'steel' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  reprovado: { label: 'Reprovado', tone: 'danger' },
}

export const ASSET_META: Record<EditorialAsset, { label: string }> = {
  copy: { label: 'Copy do post' },
  legenda: { label: 'Legenda' },
  imagens: { label: 'Imagens' },
  edicao: { label: 'Edição' },
  roteiro: { label: 'Roteiro' },
  cta: { label: 'CTA' },
}

/** Um card do criativo (slide do carrossel / bloco de roteiro). */
export interface EditorialCard {
  id: string
  text: string
}

export interface EditorialPost {
  id: string
  /** Data de publicação em ISO (yyyy-mm-dd). */
  date: string
  title: string
  format: EditorialFormat
  /** Mídia social — pode publicar em mais de um canal. */
  channels: EditorialChannel[]
  /** "Enviar" — etapa atual do fluxo. */
  stage: EditorialStage
  /** "Aprovação Anju". */
  approval: EditorialApproval
  /** Descrição / conteúdo da demanda (briefing, roteiro, instruções). */
  description?: string
  /** "Comentário Anju". */
  comment?: string
  /** "Link do upload". */
  uploadUrl?: string
  /** Chamada para ação. */
  cta?: string
  /** "Falta o quê?". */
  pending: EditorialAsset[]
  /** "O que está pronto". */
  ready: EditorialAsset[]
  /** Conteúdo card-a-card do criativo. */
  cards: EditorialCard[]
  /** Responsável (id do membro) — gera/atualiza a tarefa vinculada. */
  assignee?: string
  /** Id da tarefa criada a partir do post (vínculo Editorial → Tarefas). */
  taskId?: string
}

const c = (text: string): EditorialCard => ({ id: `c-${Math.random().toString(36).slice(2, 8)}`, text })

const EDITORIAL_SEED: Record<string, EditorialPost[]> = {
  [ANJU_ID]: [
    { id: 'ed-12', date: '2026-06-12', title: 'Corte | Construção Real', format: 'corte', channels: ['instagram'], stage: 'concluido', approval: 'aprovado', pending: [], ready: ['copy', 'legenda', 'edicao'], cards: [] },
    { id: 'ed-13', date: '2026-06-13', title: 'Carrossel | Tipos de Falha', format: 'carrossel', channels: ['instagram'], stage: 'concluido', approval: 'aprovado', pending: [], ready: ['copy', 'legenda', 'imagens'], cards: [] },
    { id: 'ed-14', date: '2026-06-14', title: 'Carrossel | Consistência', format: 'carrossel', channels: ['instagram'], stage: 'concluido', approval: 'aprovado', pending: [], ready: ['copy', 'legenda', 'imagens'], cards: [] },
    { id: 'ed-15', date: '2026-06-15', title: 'Corte | Aula | A Pergunta que Muda Tudo', format: 'corte', channels: ['instagram'], stage: 'para-edicao', approval: 'em-producao', pending: ['edicao'], ready: ['copy', 'roteiro'], cards: [] },
    { id: 'ed-16', date: '2026-06-16', title: 'Corte | YouTube | Corpo Perfeito', format: 'corte', channels: ['youtube'], stage: 'para-edicao', approval: 'em-producao', pending: ['edicao'], ready: ['roteiro'], cards: [] },
    { id: 'ed-17', date: '2026-06-17', title: 'Carrossel | Ter Tudo e Se Sentir Vazia', format: 'carrossel', channels: ['instagram'], stage: 'para-anju', approval: 'em-revisao', comment: 'Ajustar o tom do card 3 — está duro demais.', pending: [], ready: ['copy', 'legenda', 'imagens'], cards: [] },
    { id: 'ed-18', date: '2026-06-18', title: 'Carrossel | Erro Invisível', format: 'carrossel', channels: ['instagram'], stage: 'para-designer', approval: 'em-producao', pending: ['imagens'], ready: ['copy', 'legenda'], cards: [] },
    { id: 'ed-19', date: '2026-06-19', title: 'Carrossel | Sensualidade Romantizada', format: 'carrossel', channels: ['instagram'], stage: 'concluido', approval: 'aprovado', pending: [], ready: ['copy', 'legenda', 'imagens'], cards: [] },
    { id: 'ed-20', date: '2026-06-20', title: 'Reels | Falha Muscular | Corte 1', format: 'reels', channels: ['instagram'], stage: 'para-anju', approval: 'em-revisao', pending: [], ready: ['copy', 'legenda', 'edicao'], cards: [] },
    { id: 'ed-21', date: '2026-06-21', title: 'Carrossel | Falha Muscular', format: 'carrossel', channels: ['instagram'], stage: 'para-designer', approval: 'em-producao', pending: ['imagens'], ready: ['copy', 'legenda'], cards: [] },
    {
      id: 'ed-22',
      date: '2026-06-22',
      title: 'Carrossel | Mais ou Melhor',
      format: 'carrossel',
      channels: ['instagram'],
      stage: 'para-designer',
      approval: 'em-producao',
      cta: 'Comenta "TÉCNICA" que eu te mando o guia de execução.',
      pending: ['imagens'],
      ready: ['copy', 'legenda'],
      cards: [
        c('Treinar Mais ou Treinar Melhor?'),
        c('Você é constante. A frequência é impecável. E mesmo assim o resultado custa a aparecer.'),
        c('A resposta do mercado é sempre a mesma: capricha mais. Mais carga, mais série, mais sacrifício. Como se a culpa fosse sua.'),
        c('Mas esforço sem técnica não vira músculo. Vira desgaste. Escorre para o balanço, para a articulação errada, para longe do que você quer fortalecer.'),
        c('O seu treino não para por falta de esforço. Para por falta de prescrição feita para o seu corpo. Técnica não é perfeccionismo: é respeito por quem você é.'),
        c('Alguém já te falou que "é só treinar mais"?'),
      ],
    },
    { id: 'ed-23', date: '2026-06-23', title: 'Reels | Falha Muscular | Corte 2', format: 'reels', channels: ['instagram'], stage: 'para-designer', approval: 'em-producao', pending: ['edicao'], ready: ['roteiro'], cards: [] },
    { id: 'ed-24', date: '2026-06-24', title: 'Carrossel | Falha Muscular | Técnica', format: 'carrossel', channels: ['instagram'], stage: 'para-designer', approval: 'em-producao', pending: ['imagens'], ready: ['copy'], cards: [] },
    { id: 'ed-25', date: '2026-06-25', title: 'Reels | Falha Muscular | Corte 3', format: 'reels', channels: ['instagram'], stage: 'para-edicao', approval: 'em-producao', pending: ['edicao'], ready: ['roteiro'], cards: [] },
    { id: 'ed-26', date: '2026-06-26', title: 'Imagem | Motivação', format: 'imagem', channels: ['instagram'], stage: 'para-designer', approval: 'em-producao', pending: ['imagens'], ready: ['copy'], cards: [] },
    { id: 'ed-27', date: '2026-06-27', title: 'Reels | Falha Muscular | Corte 4', format: 'reels', channels: ['instagram'], stage: 'para-edicao', approval: 'em-producao', pending: ['edicao'], ready: ['roteiro'], cards: [] },
  ],
}

/** Cópia profunda do seed editorial de um cliente (para hidratar o store). */
export function getEditorialSeed(id?: string): EditorialPost[] {
  const seed = (id && EDITORIAL_SEED[id]) || []
  return seed.map((p) => ({ ...p, channels: [...p.channels], pending: [...p.pending], ready: [...p.ready], cards: p.cards.map((card) => ({ ...card })) }))
}

/** O time inteiro é responsável por cada cliente — os membros ativos. */
export const TEAM = USERS.filter((u) => u.status === 'ativo')

export interface AgendaItem {
  id: string
  day: string
  month: string
  weekday: string
  time: string
  title: string
  meta: string
  category: 'steel' | 'sand' | 'success' | 'danger'
  people?: string[]
  clientId?: string
  /** Descrição/pauta do compromisso. */
  description?: string
  /** Link da chamada (Meet/Zoom). */
  meetingUrl?: string
  /** Local — presencial ou plataforma. */
  location?: string
}

/** Dia "atual" do mock — usado para destacar "hoje" na agenda. */
export const TODAY = '18'

export const TEAM_AGENDA: AgendaItem[] = [
  { id: 'ag1', day: '18', month: 'JUN', weekday: 'Quinta', time: '09:00 – 09:15', title: 'Stand-up do time', meta: 'Diário · sala virtual', category: 'steel', people: ['Ana Lima', 'Bruno Sá', 'Eva Nunes', 'Iris Castro'], location: 'Google Meet', meetingUrl: 'https://meet.google.com/upskl-standup', description: 'Alinhamento diário: o que cada um fez ontem, o foco de hoje e bloqueios. Máx. 15 min.' },
  { id: 'ag2', day: '18', month: 'JUN', weekday: 'Quinta', time: '11:00 – 11:45', title: 'Acompanhamento · Anju Mace', meta: 'Soft opening · 2 participantes', category: 'sand', people: ['Eva Nunes', 'Ana Lima'], clientId: 'CLI-06', location: 'Google Meet', meetingUrl: 'https://meet.google.com/anju-acomp', description: 'Revisar o andamento do soft opening: calendário editorial da semana, status dos acessos e próximos entregáveis.' },
  { id: 'ag3', day: '18', month: 'JUN', weekday: 'Quinta', time: '14:30 – 15:00', title: 'Revisão de acessos', meta: 'Segurança · trimestral', category: 'steel', people: ['Bruno Sá', 'Iris Castro'], location: 'Zoom', meetingUrl: 'https://zoom.us/j/upskl-acessos', description: 'Auditoria trimestral de credenciais: conferir quem tem acesso a quê, rotacionar senhas sensíveis e revisar MFA.' },
  { id: 'ag4', day: '18', month: 'JUN', weekday: 'Quinta', time: '17:00', title: 'Planejamento da semana', meta: 'Time todo', category: 'success', people: ['Ana Lima', 'Bruno Sá'], location: 'Sala 1 · presencial', description: 'Definição de prioridades e distribuição de tarefas para a próxima semana.' },
  { id: 'ag5', day: '19', month: 'JUN', weekday: 'Sexta', time: '09:00 – 09:15', title: 'Stand-up do time', meta: 'Diário · sala virtual', category: 'steel', people: ['Ana Lima', 'Bruno Sá'], location: 'Google Meet', meetingUrl: 'https://meet.google.com/upskl-standup', description: 'Alinhamento diário do time.' },
  { id: 'ag6', day: '19', month: 'JUN', weekday: 'Sexta', time: '16:00', title: 'Retro da semana', meta: 'Time todo', category: 'success', people: ['Ana Lima', 'Bruno Sá', 'Eva Nunes', 'Iris Castro', 'Felipe Rocha'], location: 'Google Meet', meetingUrl: 'https://meet.google.com/upskl-retro', description: 'Retrospectiva: o que foi bem, o que travou e ações de melhoria para a próxima semana.' },
  { id: 'ag7', day: '20', month: 'JUN', weekday: 'Sábado', time: '02:00 – 04:00', title: 'Janela de manutenção', meta: 'Infra · automático', category: 'danger', description: 'Janela automática de manutenção da infraestrutura. Pode haver indisponibilidade momentânea dos serviços.' },
  { id: 'ag8', day: '23', month: 'JUN', weekday: 'Segunda', time: '10:30 – 11:00', title: 'Check-in · Anju Mace', meta: 'Acompanhamento mensal', category: 'steel', people: ['Eva Nunes'], clientId: 'CLI-06', location: 'Google Meet', meetingUrl: 'https://meet.google.com/anju-checkin', description: 'Check-in mensal com a cliente: resultados do mês, ajustes de rota e planejamento do próximo ciclo.' },
]

export interface DailyStep {
  label: string
  description: string
}

/** Etapas do projeto no dia atual (pipeline diário). `current` = etapa em curso. */
export const DAILY_STEPS: DailyStep[] = [
  { label: 'Planejamento', description: 'Prioridades definidas' },
  { label: 'Execução', description: 'Em andamento' },
  { label: 'Revisão', description: 'A iniciar' },
  { label: 'Entrega', description: '17:00' },
]
export const DAILY_CURRENT = 1

export interface DailyTask {
  id: string
  label: string
  done: boolean
  tag?: string
  clientId?: string
}

/** Tarefas do dia do colaborador logado (mock). */
export const MY_TASKS: DailyTask[] = [
  { id: 't1', label: 'Revisar plano da Anju Mace', done: false, tag: 'Conteúdo', clientId: 'CLI-06' },
  { id: 't2', label: 'Responder tickets pendentes do Suporte', done: false, tag: 'Suporte' },
  { id: 't3', label: 'Validar novos acessos da plataforma', done: false, tag: 'Suporte' },
  { id: 't4', label: 'Preparar pauta do stand-up', done: true, tag: 'Suporte' },
  { id: 't5', label: 'Atualizar materiais da base de conhecimento', done: true, tag: 'Conteúdo' },
]

/* ---- Tarefas (gestão estilo ClickUp/Asana) ---------------------------- */

/** Status (colunas do quadro). */
export type TaskStatus = 'a-fazer' | 'em-andamento' | 'em-revisao' | 'concluida'
/** Prioridade da tarefa. */
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente'
/** Categoria — classifica a tarefa por área/tipo de trabalho. */

export const TASK_STATUS_ORDER: TaskStatus[] = ['a-fazer', 'em-andamento', 'em-revisao', 'concluida']

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; tone: 'neutral' | 'steel' | 'warning' | 'success' }
> = {
  'a-fazer': { label: 'A fazer', tone: 'neutral' },
  'em-andamento': { label: 'Em andamento', tone: 'steel' },
  'em-revisao': { label: 'Em revisão', tone: 'warning' },
  concluida: { label: 'Concluída', tone: 'success' },
}

export const TASK_PRIORITY_ORDER: TaskPriority[] = ['urgente', 'alta', 'media', 'baixa']

export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; tone: 'neutral' | 'steel' | 'warning' | 'danger' }
> = {
  urgente: { label: 'Urgente', tone: 'danger' },
  alta: { label: 'Alta', tone: 'warning' },
  media: { label: 'Média', tone: 'steel' },
  baixa: { label: 'Baixa', tone: 'neutral' },
}

/** Entrada do histórico/log de uma tarefa. */
export interface TaskEvent {
  id: string
  /** ISO timestamp. */
  at: string
  /** Nome de quem fez a ação. */
  who: string
  /** Descrição da ação (ex.: "moveu para Em andamento"). */
  text: string
}

/** Item de checklist / subtarefa de uma tarefa. */
export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  /** Ids de usuários responsáveis (USERS). */
  assignees: string[]
  /** Prazo em ISO (yyyy-mm-dd). */
  due?: string
  /** Categoria — valor livre, gerido pelo catálogo `task_category`. */
  tag?: string
  clientId?: string
  /** Subtarefas / checklist. */
  checklist?: ChecklistItem[]
  /** ISO timestamp de criação. */
  createdAt: string
  /** ISO timestamp de conclusão. */
  completedAt?: string
  /** Responsáveis guardados ao entrar em revisão — restaurados ao sair dela. */
  reviewFrom?: string[]
  history: TaskEvent[]
}

/**
 * Responsáveis para fins de avanço/carga por pessoa. Durante a revisão a
 * tarefa fica com o administrador (que só revisa), então o avanço conta para
 * quem executou (review_from), não para o revisor.
 */
export function taskExecutors(task: Task): string[] {
  return task.status === 'em-revisao' && task.reviewFrom && task.reviewFrom.length
    ? task.reviewFrom
    : task.assignees
}

/** Seed inicial — hidrata o store na primeira carga. */
const TASKS_SEED: Task[] = [
  {
    id: 'tk-001', title: 'Revisar plano da Anju Mace', status: 'em-andamento', priority: 'alta',
    assignees: ['USR-1047'], due: '2026-06-24', tag: 'Conteúdo', clientId: 'CLI-06',
    description: 'Revisar o planejamento de soft opening e ajustar entregáveis da semana.',
    createdAt: '2026-06-20T13:00:00.000Z',
    history: [
      { id: 'h1', at: '2026-06-20T13:00:00.000Z', who: 'Ana Lima', text: 'criou a tarefa' },
      { id: 'h2', at: '2026-06-23T11:30:00.000Z', who: 'Felipe Rocha', text: 'moveu para Em andamento' },
    ],
  },
  {
    id: 'tk-002', title: 'Responder tickets pendentes do Suporte', status: 'a-fazer', priority: 'urgente',
    assignees: ['USR-1047', 'USR-1043'], due: '2026-06-23', tag: 'Suporte',
    description: 'Fila de atendimento com 12 tickets abertos. Priorizar os de SLA estourando.',
    createdAt: '2026-06-22T09:00:00.000Z',
    history: [{ id: 'h1', at: '2026-06-22T09:00:00.000Z', who: 'Ana Lima', text: 'criou a tarefa' }],
  },
  {
    id: 'tk-003', title: 'Validar novos acessos da plataforma', status: 'a-fazer', priority: 'media',
    assignees: ['USR-1047'], due: '2026-06-25', tag: 'Suporte',
    description: 'Conferir credenciais cadastradas no cofre da Anju Mace e marcar os que exigem MFA.',
    createdAt: '2026-06-22T15:20:00.000Z',
    history: [{ id: 'h1', at: '2026-06-22T15:20:00.000Z', who: 'Eva Nunes', text: 'criou a tarefa' }],
  },
  {
    id: 'tk-004', title: 'Preparar pauta do stand-up', status: 'concluida', priority: 'baixa',
    assignees: ['USR-1047'], due: '2026-06-23', tag: 'Suporte',
    createdAt: '2026-06-22T18:00:00.000Z', completedAt: '2026-06-23T08:45:00.000Z',
    history: [
      { id: 'h1', at: '2026-06-22T18:00:00.000Z', who: 'Felipe Rocha', text: 'criou a tarefa' },
      { id: 'h2', at: '2026-06-23T08:45:00.000Z', who: 'Felipe Rocha', text: 'concluiu a tarefa' },
    ],
  },
  {
    id: 'tk-005', title: 'Atualizar materiais da base de conhecimento', status: 'concluida', priority: 'media',
    assignees: ['USR-1047', 'USR-1044'], due: '2026-06-20', tag: 'Conteúdo',
    createdAt: '2026-06-18T10:00:00.000Z', completedAt: '2026-06-20T16:10:00.000Z',
    history: [
      { id: 'h1', at: '2026-06-18T10:00:00.000Z', who: 'Carla Reis', text: 'criou a tarefa' },
      { id: 'h2', at: '2026-06-20T16:10:00.000Z', who: 'Felipe Rocha', text: 'concluiu a tarefa' },
    ],
  },
  {
    id: 'tk-006', title: 'Configurar automação de boas-vindas (n8n)', status: 'em-revisao', priority: 'alta',
    assignees: ['USR-1042'], due: '2026-06-24', tag: 'Conteúdo', clientId: 'CLI-06',
    description: 'Fluxo de onboarding automático no n8n disparando e-mail + mensagem no WhatsApp.',
    createdAt: '2026-06-19T11:00:00.000Z',
    history: [
      { id: 'h1', at: '2026-06-19T11:00:00.000Z', who: 'Ana Lima', text: 'criou a tarefa' },
      { id: 'h2', at: '2026-06-23T10:00:00.000Z', who: 'Ana Lima', text: 'moveu para Em revisão' },
    ],
  },
  {
    id: 'tk-007', title: 'Editar lote de vídeos · AV Batch 1', status: 'em-andamento', priority: 'media',
    assignees: ['USR-1046'], due: '2026-06-26', tag: 'Conteúdo', clientId: 'CLI-06',
    createdAt: '2026-06-21T14:00:00.000Z',
    history: [
      { id: 'h1', at: '2026-06-21T14:00:00.000Z', who: 'Eva Nunes', text: 'criou a tarefa' },
      { id: 'h2', at: '2026-06-22T09:30:00.000Z', who: 'Eva Nunes', text: 'moveu para Em andamento' },
    ],
  },
  {
    id: 'tk-008', title: 'Revisar permissões do time · Suporte', status: 'a-fazer', priority: 'baixa',
    assignees: ['USR-1043'], due: '2026-06-30', tag: 'Suporte',
    createdAt: '2026-06-22T16:00:00.000Z',
    history: [{ id: 'h1', at: '2026-06-22T16:00:00.000Z', who: 'Ana Lima', text: 'criou a tarefa' }],
  },
]

export function getTasksSeed(): Task[] {
  return TASKS_SEED.map((t) => ({
    ...t,
    assignees: [...t.assignees],
    history: t.history.map((h) => ({ ...h })),
  }))
}

/** Série fictícia de sessões por dia (para o ChartFrame). */
export const SESSIONS_7D = [
  { day: 'Seg', value: 142 },
  { day: 'Ter', value: 168 },
  { day: 'Qua', value: 155 },
  { day: 'Qui', value: 201 },
  { day: 'Sex', value: 188 },
  { day: 'Sáb', value: 96 },
  { day: 'Dom', value: 74 },
]
