import { ShowcaseSection } from '../ui'
import { cn } from '../../lib/cn'

/* Dados de tokens (nome → valor) para amostras visuais ----------------------- */
const RAMPS = {
  graphite: { 50: '#F4F4F4', 100: '#E6E6E6', 200: '#CCCCCC', 300: '#A6A6A6', 400: '#808080', 500: '#5C5C5C', 600: '#3D3D3D', 700: '#2F2F2F', 800: '#282828', 900: '#222222', 950: '#1A1A1A' },
  cream: { 50: '#FCFCF2', 100: '#F5F5DD', 200: '#ECECC9', 300: '#E5E5CA' },
  sand: { 50: '#FFF7F0', 100: '#FAF0E6', 200: '#EDDCCB' },
  mist: { 50: '#FAFAFC', 100: '#F5F5F7', 200: '#EBEAEE', 300: '#E6E6E6' },
  sage: { 50: '#F2F5EC', 100: '#E3EAD6', 200: '#CDD9B8', 300: '#B5C59C', 400: '#9EAB87', 500: '#889573', 600: '#7A8569', 700: '#636E55', 800: '#4D5443', 900: '#3A3F33' },
  gold: { 50: '#FAF4E6', 100: '#F2E6C8', 200: '#E9D4A4', 300: '#DABE81', 400: '#CBA75E', 500: '#BE9234', 600: '#9E7B2C', 700: '#7D6124', 800: '#6B4A1E' },
  taupe: { 100: '#EDE6DD', 300: '#B8AE9F', 500: '#8A7F70', 700: '#6A6158' },
  slate: { 200: '#D2D7DD', 300: '#B5BEC6', 400: '#8F99A3', 500: '#7B7E91', 600: '#6A7988' },
}
const FEEDBACK = { red: ['#FDE0E0', '#F95252', '#C13838', '#9A2D2D'], green: ['#E3EFD9', '#7FA86B', '#5E7E4A'], amber: ['#F7ECCB', '#DABE81', '#BE9234'], blue: ['#E3ECF2', '#6A88A8', '#4F6B89'] }

const SEMANTIC = [
  ['surface-base', 'bg-surface-base'], ['surface', 'bg-surface'], ['surface-sunken', 'bg-surface-sunken'],
  ['surface-inverse', 'bg-surface-inverse'], ['accent', 'bg-accent'], ['accent-2', 'bg-accent-2'],
  ['accent-subtle', 'bg-accent-subtle'], ['border', 'bg-border'], ['success', 'bg-success'],
  ['warning', 'bg-warning'], ['danger', 'bg-danger'], ['info', 'bg-info'],
]

const TYPE = [
  ['text-display', 'Display · 62 / Lexend light', 'Movimento'],
  ['text-h1', 'H1 · 40 / Lexend light', 'Transformação consciente'],
  ['text-h2', 'H2 · 34 / Lexend light', 'Pioneiras em evolução'],
  ['text-h3', 'H3 · 28 / Lexend', 'Força & mobilidade'],
  ['text-h4', 'H4 · 24 / Lexend', 'Seu treino de hoje'],
  ['text-body-lg', 'Body LG · 18 / Outfit', 'A transformação que você merece começa aqui.'],
  ['text-body', 'Body · 16 / Outfit', 'Consultoria com rigor científico e execução elegante.'],
  ['text-body-sm', 'Body SM · 14 / Outfit', 'Texto de apoio e legendas curtas.'],
  ['text-label', 'Label · 10 / tracking 0.16em', 'Avaliação exclusiva'],
]

const SPACES = [['1', 4], ['2', 8], ['3', 12], ['4', 16], ['6', 24], ['8', 32], ['12', 48], ['16', 64], ['24', 96]]
const RADII = [['xs', 'rounded-xs'], ['sm', 'rounded-sm'], ['md', 'rounded-md'], ['lg', 'rounded-lg'], ['xl', 'rounded-xl'], ['2xl', 'rounded-2xl'], ['3xl', 'rounded-3xl'], ['full', 'rounded-full']]
const SHADOWS = [['xs', 'shadow-xs'], ['sm', 'shadow-sm'], ['md', 'shadow-md'], ['lg', 'shadow-lg'], ['xl', 'shadow-xl'], ['glass', 'shadow-glass']]

function Swatch({ value, name, sub }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-14 rounded-xl border border-subtle" style={{ background: value }} />
      <div className="flex flex-col">
        <span className="text-2xs font-medium text-content">{name}</span>
        {sub && <span className="text-2xs text-content-muted tabular-nums">{sub}</span>}
      </div>
    </div>
  )
}

function Ramp({ name, scale }) {
  return (
    <div>
      <p className="text-label text-content-muted mb-2">{name}</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
        {Object.entries(scale).map(([k, v]) => (
          <Swatch key={k} value={v} name={k} sub={v} />
        ))}
      </div>
    </div>
  )
}

export function FoundationsSection() {
  return (
    <div className="space-y-20">
      {/* COR */}
      <ShowcaseSection id="f-color" title="Cor — ramps primitivas">
        <div className="space-y-6">
          {Object.entries(RAMPS).map(([name, scale]) => (
            <Ramp key={name} name={name} scale={scale} />
          ))}
          <div>
            <p className="text-label text-content-muted mb-2">feedback</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
              {Object.entries(FEEDBACK).flatMap(([n, arr]) => arr.map((v, i) => <Swatch key={n + i} value={v} name={`${n}-${i}`} sub={v} />))}
            </div>
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="f-semantic" title="Cor — tokens semânticos (trocam com o tema)">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {SEMANTIC.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div className={cn('h-16 rounded-xl border border-subtle', cls)} />
              <span className="text-2xs font-medium text-content-muted">{name}</span>
            </div>
          ))}
        </div>
      </ShowcaseSection>

      {/* TIPOGRAFIA */}
      <ShowcaseSection id="f-type" title="Tipografia — escala">
        <div className="flex flex-col divide-y divide-border">
          {TYPE.map(([cls, meta, sample]) => (
            <div key={cls} className="grid gap-2 py-5 md:grid-cols-[240px_1fr] md:items-baseline">
              <span className="text-2xs text-content-muted">{meta}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </ShowcaseSection>

      {/* ESPAÇO */}
      <ShowcaseSection id="f-space" title="Espaçamento — escala 4/8pt">
        <div className="flex flex-col gap-3">
          {SPACES.map(([name, px]) => (
            <div key={name} className="flex items-center gap-4">
              <span className="w-14 text-2xs text-content-muted tabular-nums">space-{name}</span>
              <span className="h-4 rounded bg-accent" style={{ width: px }} />
              <span className="text-2xs text-content-muted tabular-nums">{px}px</span>
            </div>
          ))}
        </div>
      </ShowcaseSection>

      {/* RAIO + SOMBRA */}
      <ShowcaseSection id="f-elevation" title="Raio & elevação">
        <div className="space-y-8">
          <div>
            <p className="text-label text-content-muted mb-3">Raio</p>
            <div className="flex flex-wrap gap-6">
              {RADII.map(([name, cls]) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div className={cn('size-16 bg-accent-subtle border border-accent', cls)} />
                  <span className="text-2xs text-content-muted">{name}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-label text-content-muted mb-3">Sombra</p>
            <div className="flex flex-wrap gap-6">
              {SHADOWS.map(([name, cls]) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div className={cn('size-16 rounded-2xl bg-surface', cls)} />
                  <span className="text-2xs text-content-muted">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ShowcaseSection>

      {/* MOTION */}
      <ShowcaseSection id="f-motion" title="Motion — durações & easings">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['fast · 150ms', 'duration-fast'],
            ['base · 200ms', 'duration-base'],
            ['moderate · 300ms', 'duration-moderate'],
            ['slow · 400ms', 'duration-slow'],
          ].map(([label, dur]) => (
            <div key={dur} className="group rounded-2xl border border-subtle bg-surface p-5">
              <p className="text-2xs text-content-muted mb-3">{label} · hover</p>
              <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                <div className={cn('h-full w-0 rounded-full bg-accent transition-all ease-out group-hover:w-full', dur)} />
              </div>
              <div className={cn('mt-4 size-10 rounded-xl bg-accent-2 transition-transform ease-spring group-hover:translate-x-[calc(100%-2.5rem)]', dur)} />
            </div>
          ))}
        </div>
        <p className="text-caption">Passe o mouse sobre cada card para ver a duração/easing.</p>
      </ShowcaseSection>
    </div>
  )
}
