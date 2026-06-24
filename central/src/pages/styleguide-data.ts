/** Dados de tokens para renderizar swatches e specs no styleguide. */

export interface Swatch {
  name: string
  varName: string
  value: string
  note?: string
}

export const colorGroups: { group: string; hint: string; swatches: Swatch[] }[] = [
  {
    group: 'Fundo',
    hint: 'frio, em camadas para profundidade',
    swatches: [
      { name: 'ink', varName: '--ink', value: '#0A0B0D', note: 'canvas do app' },
      { name: 'ink-deep', varName: '--ink-deep', value: '#07080A', note: 'poços / sidebar' },
      { name: 'slate-900', varName: '--slate-900', value: '#101218', note: 'superfície (cards)' },
      { name: 'slate-800', varName: '--slate-800', value: '#161922', note: 'elevada / hover' },
      { name: 'slate-700', varName: '--slate-700', value: '#1E2230', note: 'popovers / ativo' },
      { name: 'slate-600', varName: '--slate-600', value: '#2A2F3D', note: 'forte / pressed' },
    ],
  },
  {
    group: 'Steel — accent primário',
    hint: 'ações, links, foco, seleção · camada temável',
    swatches: [
      { name: 'steel-300', varName: '--steel-300', value: '#A9BAD9' },
      { name: 'steel-400', varName: '--steel-400', value: '#8AA0CB' },
      { name: 'steel-500', varName: '--steel-500', value: '#6E89BE', note: 'primário' },
      { name: 'steel-600', varName: '--steel-600', value: '#56719F' },
      { name: 'steel-700', varName: '--steel-700', value: '#3F5577' },
      { name: 'steel-tint', varName: '--steel-tint', value: 'rgba(110,137,190,.14)', note: 'selecionado' },
    ],
  },
  {
    group: 'Sand — assinatura quente',
    hint: 'ênfase pontual · camada temável',
    swatches: [
      { name: 'sand-100', varName: '--sand-100', value: '#F2EEE5' },
      { name: 'sand-200', varName: '--sand-200', value: '#E3DDD1', note: 'card invertido' },
      { name: 'sand-300', varName: '--sand-300', value: '#CDC5B5' },
      { name: 'sand-deep', varName: '--sand-deep', value: '#2A2620', note: 'quente-escura' },
      { name: 'sand-tint', varName: '--sand-tint', value: 'rgba(227,221,209,.10)' },
    ],
  },
  {
    group: 'Status',
    hint: 'dessaturados — nada de neon',
    swatches: [
      { name: 'ok', varName: '--ok', value: '#6FBF95', note: 'sucesso' },
      { name: 'err', varName: '--err', value: '#DD7A70', note: 'erro' },
      { name: 'warn', varName: '--warn', value: '#D8A75C', note: 'atenção' },
      { name: 'steel-500', varName: '--steel-500', value: '#6E89BE', note: 'info reutiliza steel' },
    ],
  },
  {
    group: 'Texto',
    hint: 'off-whites frios — nunca #fff puro',
    swatches: [
      { name: 'text-strong', varName: '--text-strong', value: '#F0F2F7' },
      { name: 'text', varName: '--text', value: '#C2C9D6', note: 'corpo' },
      { name: 'text-muted', varName: '--text-muted', value: '#828B9C' },
      { name: 'text-faint', varName: '--text-faint', value: '#565E6E' },
      { name: 'text-on-sand', varName: '--text-on-sand', value: '#1A1814', note: 'sobre Sand' },
    ],
  },
]

export interface TypeSpec {
  name: string
  className: string
  specs: string
  sample: string
  family: 'display' | 'sans' | 'mono'
  weight?: number
}

export const typeScale: TypeSpec[] = [
  { name: 'display-xl', className: 'text-display-xl font-display font-semibold', specs: '56 · 1.04 · -0.02em · Host Grotesk 600', sample: 'Central de operações', family: 'display' },
  { name: 'display-l', className: 'text-display-l font-display font-semibold', specs: '40 · 1.08 · -0.02em · Host Grotesk 600', sample: 'Visão geral do time', family: 'display' },
  { name: 'h1', className: 'text-h1 font-display font-semibold', specs: '30 · 1.15 · -0.015em · HG 600', sample: 'Projetos ativos', family: 'display' },
  { name: 'h2', className: 'text-h2 font-display font-semibold', specs: '24 · 1.20 · -0.01em · HG 600', sample: 'Agenda da semana', family: 'display' },
  { name: 'h3', className: 'text-h3 font-display font-semibold', specs: '19 · 1.30 · -0.005em · HG 600', sample: 'Reuniões de hoje', family: 'display' },
  { name: 'body-l', className: 'text-body-l', specs: '16 · 1.55 · Inter 400/500', sample: 'Acompanhe o andamento de cada cliente em um só lugar.', family: 'sans' },
  { name: 'body', className: 'text-body', specs: '14 · 1.55 · Inter 400 — base de UI', sample: 'Acompanhe o andamento de cada cliente em um só lugar.', family: 'sans' },
  { name: 'body-s', className: 'text-body-s', specs: '13 · 1.50 · Inter 400', sample: 'Acompanhe o andamento de cada cliente em um só lugar.', family: 'sans' },
  { name: 'caption', className: 'text-caption font-medium', specs: '12 · 1.45 · Inter 500', sample: 'Atualizado há 4 minutos', family: 'sans' },
  { name: 'mono-label', className: 'text-mono-label font-mono uppercase', specs: '11.5 · 0.12em · UPPER · Inter 500', sample: 'EM ANDAMENTO', family: 'mono', weight: 500 },
  { name: 'mono-data', className: 'text-mono-data font-mono', specs: '13 · Inter 400 — tabular (tnum)', sample: 'UPS-0429 · 18/06/2026 · 14:30', family: 'mono' },
]

export const radii = [
  { name: 'r-xs', value: '6px', use: 'inputs, chips' },
  { name: 'r-sm', value: '8px', use: '—' },
  { name: 'r-md', value: '10px', use: 'botões, badges' },
  { name: 'r-lg', value: '14px', use: 'cards' },
  { name: 'r-xl', value: '18px', use: 'painéis, modais' },
  { name: 'r-2xl', value: '24px', use: 'cards-herói' },
]

export const spacing = [
  { name: '0', value: '0' },
  { name: '2', value: '2px' },
  { name: '4', value: '4px' },
  { name: '6', value: '6px' },
  { name: '8', value: '8px' },
  { name: '12', value: '12px' },
  { name: '16', value: '16px' },
  { name: '20', value: '20px' },
  { name: '24', value: '24px' },
  { name: '32', value: '32px' },
  { name: '40', value: '40px' },
  { name: '48', value: '48px' },
  { name: '64', value: '64px' },
  { name: '80', value: '80px' },
]

export const elevations = [
  { name: 'e1', shadow: 'shadow-e1', desc: '0 1px 2px / .45' },
  { name: 'e2', shadow: 'shadow-e2', desc: '0 4px 14px / .40' },
  { name: 'e3', shadow: 'shadow-e3', desc: '0 14px 40px / .50' },
  { name: 'focus-ring', shadow: 'shadow-focus', desc: 'anel de foco steel' },
  { name: 'glow-active', shadow: 'shadow-active', desc: 'estado aceso' },
]

export const motions = [
  { name: 'dur-fast', value: '120ms' },
  { name: 'dur', value: '180ms' },
  { name: 'dur-slow', value: '260ms' },
  { name: 'ease-out', value: 'cubic-bezier(.22,.8,.26,1)' },
  { name: 'ease-inout', value: 'cubic-bezier(.65,0,.35,1)' },
]
