import { useMemo, useState } from 'react'
import {
  Megaphone,
  Image as ImageIcon,
  Video,
  Images,
  Globe,
  MousePointerClick,
  Users,
  Target,
  Eye,
  Trophy,
  Banknote,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  StatCard,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  EmptyState,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { usePaidTraffic } from './paidTraffic'
import {
  aggregate,
  delta,
  type Campaign,
  type Kpis,
  fmtMoney,
  fmtMoneyCents,
  fmtInt,
  fmtCompact,
  fmtPct,
  fmtX,
  PLATFORM_META,
  STATUS_META,
  CREATIVE_META,
  type Platform,
  type CreativeType,
  type Creative,
  type DailyMetric,
} from './paidTraffic'

/* ----------------------------------------------------------------------------
   Tráfego Pago — painel de mídia paga (Meta + Google)
   ----------------------------------------------------------------------------
   Tudo é derivado em memória das métricas diárias cruas: KPIs (investimento,
   CPL, CPA, CPC, CTR, ROAS), série de gasto no tempo, divisão por plataforma e
   campanha, ranking de criativos (estáticos / vídeos / carrosséis) e páginas de
   captura. Filtros de período e plataforma recalculam tudo. Mesmos tokens e
   componentes do design system da central (cf. ReportsPage).
---------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000

const PERIODS = [
  { key: 7, label: '7 dias' },
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
  { key: 0, label: 'Tudo' },
] as const

const PLATFORM_FILTERS = [
  { key: 'all' as const, label: 'Todas' },
  { key: 'meta' as const, label: 'Meta' },
  { key: 'google' as const, label: 'Google' },
]

const VIEWS = [
  { key: 'overview' as const, label: 'Visão geral' },
  { key: 'campaigns' as const, label: 'Campanhas' },
  { key: 'creatives' as const, label: 'Criativos' },
  { key: 'pages' as const, label: 'Páginas' },
]

type PlatformFilter = 'all' | Platform
type View = (typeof VIEWS)[number]['key']

/* ----------------------------------------------------------------- helpers */

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
function daysAgo(iso: string, todayMs: number): number {
  const t = new Date(iso + 'T00:00:00').getTime()
  return Math.round((todayMs - t) / DAY_MS)
}

/* --------------------------------------------------------- mini componentes */

/** Botões segmentados (período, plataforma, view) — visual de ReportsPage. */
function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: readonly { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-slate-900 p-1">
      {options.map((o) => (
        <button
          key={String(o.key)}
          onClick={() => onChange(o.key)}
          className={cn(
            'rounded-md font-mono uppercase transition-colors focus-visible:outline-none focus-visible:shadow-focus',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-mono-data',
            value === o.key ? 'bg-steel-500 text-accent-fg' : 'text-muted hover:text-strong',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Chip de plataforma com a cor da marca. */
function PlatformChip({ platform }: { platform: Platform }) {
  const p = PLATFORM_META[platform]
  return (
    <span
      className="inline-flex h-5 items-center gap-1 rounded-md px-1.5 font-mono text-[10px] uppercase leading-none text-strong"
      style={{ backgroundColor: `${p.hex}22`, color: p.hex }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.hex }} aria-hidden />
      {p.short}
    </span>
  )
}

/** Barra horizontal de distribuição (rótulo · barra · valor). */
function DistBar({ label, value, total, hex, valueLabel }: { label: React.ReactNode; value: number; total: number; hex: string; valueLabel: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-40 shrink-0 items-center gap-2 truncate text-body-s text-fg">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink-deep/60">
        <span className="absolute inset-y-0 left-0 rounded-full transition-[width]" style={{ width: `${pct}%`, backgroundColor: hex }} aria-hidden />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-mono-data tabular-nums text-muted">{valueLabel}</span>
    </div>
  )
}

/** Mini barras (sparkline) normalizadas — série de gasto/custo no tempo. */
function Sparkbars({ data, hex, height = 40 }: { data: number[]; hex: string; height?: number }) {
  const max = Math.max(1, ...data)
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="min-w-0 flex-1 rounded-t-[2px] transition-[height]"
          style={{ height: `${Math.max(v > 0 ? 8 : 0, Math.round((v / max) * 100))}%`, backgroundColor: hex }}
          aria-hidden
        />
      ))}
    </div>
  )
}

/* =========================================================================== */

export function PaidTrafficPage() {
  const { campaigns, metrics, creatives, pages, loading, usingMock } = usePaidTraffic()
  const [period, setPeriod] = useState<number>(30)
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [view, setView] = useState<View>('overview')

  const campaignById = useMemo(
    () => Object.fromEntries(campaigns.map((c) => [c.id, c])) as Record<string, Campaign>,
    [campaigns],
  )

  const model = useMemo(() => {
    const todayMs = startOfDayMs(new Date())
    const windowDays = period === 0 ? 90 : period

    const platformOf = (m: DailyMetric) => campaignById[m.campaignId]?.platform
    const matchesPlatform = (pf: Platform | undefined) => platform === 'all' || pf === platform

    // Métricas dentro da janela atual e da janela anterior (para deltas).
    const curr: DailyMetric[] = []
    const prev: DailyMetric[] = []
    for (const m of metrics) {
      if (!matchesPlatform(platformOf(m))) continue
      const d = daysAgo(m.date, todayMs)
      if (d >= 0 && d < windowDays) curr.push(m)
      else if (period !== 0 && d >= windowDays && d < windowDays * 2) prev.push(m)
    }

    const kpis = aggregate(curr)
    const prevKpis = aggregate(prev)
    const hasPrev = period !== 0 && prev.length > 0

    // Série temporal de gasto (diária até 10 dias, senão semanal).
    const daily = windowDays <= 10
    const buckets = daily ? windowDays : Math.ceil(windowDays / 7)
    const spendSeries = Array.from({ length: buckets }, () => 0)
    const leadSeries = Array.from({ length: buckets }, () => 0)
    // Para CPL/CPC/CPA semanais.
    const wkSpend = Array.from({ length: buckets }, () => 0)
    const wkLeads = Array.from({ length: buckets }, () => 0)
    const wkClicks = Array.from({ length: buckets }, () => 0)
    const wkSales = Array.from({ length: buckets }, () => 0)
    for (const m of curr) {
      const d = daysAgo(m.date, todayMs)
      const idx = daily ? buckets - 1 - d : buckets - 1 - Math.floor(d / 7)
      if (idx < 0 || idx >= buckets) continue
      spendSeries[idx] += m.spend
      leadSeries[idx] += m.leads
      wkSpend[idx] += m.spend
      wkLeads[idx] += m.leads
      wkClicks[idx] += m.clicks
      wkSales[idx] += m.sales
    }
    const cplSeries = wkSpend.map((s, i) => (wkLeads[i] ? s / wkLeads[i] : 0))
    const cpcSeries = wkSpend.map((s, i) => (wkClicks[i] ? s / wkClicks[i] : 0))
    const cpaSeries = wkSpend.map((s, i) => (wkSales[i] ? s / wkSales[i] : 0))

    // Divisão por plataforma.
    const byPlatform = (['meta', 'google'] as Platform[])
      .map((pf) => ({ platform: pf, ...aggregate(curr.filter((m) => platformOf(m) === pf)) }))
      .filter((r) => r.spend > 0)

    // Por campanha (ranqueado por investimento).
    const byCampaign = campaigns
      .filter((c) => platform === 'all' || c.platform === platform)
      .map((c) => ({ campaign: c, ...aggregate(curr.filter((m) => m.campaignId === c.id)) }))
      .filter((r) => r.spend > 0)
      .sort((a, b) => b.spend - a.spend)

    return { kpis, prevKpis, hasPrev, daily, buckets, spendSeries, leadSeries, cplSeries, cpcSeries, cpaSeries, byPlatform, byCampaign, windowDays }
  }, [metrics, campaigns, campaignById, period, platform])

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '30 dias'
  const { kpis, prevKpis, hasPrev } = model

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="h-40 animate-pulse rounded-lg border border-line bg-slate-900" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-6 py-8">
      {/* Cabeçalho + filtros */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-mono-label uppercase text-steel-400">
            <Megaphone size={14} strokeWidth={1.5} aria-hidden />
            Mídia paga
          </div>
          <h1 className="mt-1.5 font-display text-display-l font-semibold leading-tight text-strong">Tráfego Pago</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented options={PLATFORM_FILTERS} value={platform} onChange={setPlatform} />
          <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        </div>
      </div>

      {usingMock && (
        <div className="flex items-center gap-2 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-body-s text-fg">
          <Badge tone="warning" size="sm">Demo</Badge>
          Exibindo dados de demonstração. Conecte a API do Meta/Google ou insira os números nas tabelas{' '}
          <code className="font-mono text-[12px] text-muted">paid_*</code> para ver os dados reais.
        </div>
      )}

      {/* Navegação de seções */}
      <Segmented options={VIEWS} value={view} onChange={setView} size="sm" />

      {/* ----------------------------------------------------------- VISÃO GERAL */}
      {view === 'overview' && (
        <>
          {/* KPIs principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Investimento" value={fmtMoney(kpis.spend)} active delta={hasPrev ? delta(kpis.spend, prevKpis.spend) : undefined} />
            <StatCard label="Leads" value={fmtInt(kpis.leads)} delta={hasPrev ? delta(kpis.leads, prevKpis.leads) : undefined} />
            <StatCard label="Custo por lead" value={fmtMoneyCents(kpis.cpl)} delta={hasPrev ? delta(kpis.cpl, prevKpis.cpl, true) : undefined} />
            <StatCard label="ROAS" value={fmtX(kpis.roas)} delta={hasPrev ? delta(kpis.roas, prevKpis.roas) : undefined} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="CPA · custo/venda" value={fmtMoneyCents(kpis.cpa)} delta={hasPrev ? delta(kpis.cpa, prevKpis.cpa, true) : undefined} />
            <StatCard label="CPC · custo/clique" value={fmtMoneyCents(kpis.cpc)} delta={hasPrev ? delta(kpis.cpc, prevKpis.cpc, true) : undefined} />
            <StatCard label="CTR" value={fmtPct(kpis.ctr)} delta={hasPrev ? delta(kpis.ctr, prevKpis.ctr) : undefined} />
            <StatCard label="Impressões" value={fmtCompact(kpis.impressions)} delta={hasPrev ? delta(kpis.impressions, prevKpis.impressions) : undefined} />
          </div>

          {/* Gasto no tempo */}
          <Card>
            <CardHeader>
              <CardTitle>Investimento ao longo do tempo</CardTitle>
              <span className="font-mono text-mono-label uppercase text-faint">
                {model.daily ? `últimos ${model.windowDays} dias` : `por semana · ${periodLabel.toLowerCase()}`}
              </span>
            </CardHeader>
            <div className="flex items-end gap-2" style={{ height: 180 }}>
              {model.spendSeries.map((v, i) => {
                const max = Math.max(1, ...model.spendSeries)
                const h = Math.round((v / max) * 100)
                const fromEnd = model.spendSeries.length - 1 - i
                return (
                  <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="font-mono text-[10px] tabular-nums text-muted">{v > 0 ? fmtCompact(v) : ''}</span>
                    <div className="w-full rounded-t-sm bg-steel-500 transition-[height]" style={{ height: `${Math.max(v > 0 ? 4 : 0, h)}%` }} aria-hidden />
                    <span className="font-mono text-[10px] uppercase text-faint">
                      {model.daily ? (fromEnd === 0 ? 'hoje' : `-${fromEnd}d`) : fromEnd === 0 ? 'agora' : `-${fromEnd}s`}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Distribuições */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Investimento por plataforma</CardTitle>
              </CardHeader>
              {model.byPlatform.length === 0 ? (
                <p className="py-3 text-body-s text-faint">Sem investimento no período.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {model.byPlatform.map((r) => (
                    <DistBar
                      key={r.platform}
                      label={<PlatformChip platform={r.platform} />}
                      value={r.spend}
                      total={kpis.spend}
                      hex={PLATFORM_META[r.platform].hex}
                      valueLabel={fmtMoney(r.spend)}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investimento por campanha</CardTitle>
                <span className="font-mono text-mono-label uppercase text-faint">top {Math.min(6, model.byCampaign.length)}</span>
              </CardHeader>
              {model.byCampaign.length === 0 ? (
                <p className="py-3 text-body-s text-faint">Sem campanhas com gasto.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {model.byCampaign.slice(0, 6).map((r) => (
                    <DistBar
                      key={r.campaign.id}
                      label={<span className="truncate">{r.campaign.name}</span>}
                      value={r.spend}
                      total={kpis.spend}
                      hex={PLATFORM_META[r.campaign.platform].hex}
                      valueLabel={fmtMoney(r.spend)}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Custos ao longo do tempo (CPL / CPC / CPA) */}
          <Card>
            <CardHeader>
              <CardTitle>Custos ao longo do tempo</CardTitle>
              <span className="font-mono text-mono-label uppercase text-faint">{model.daily ? 'por dia' : 'por semana'}</span>
            </CardHeader>
            <div className="grid gap-5 sm:grid-cols-3">
              <CostTrend label="Custo por lead" current={kpis.cpl} series={model.cplSeries} hex={PLATFORM_META.meta.hex} />
              <CostTrend label="Custo por clique" current={kpis.cpc} series={model.cpcSeries} hex={CREATIVE_META.video.hex} />
              <CostTrend label="Custo por aquisição" current={kpis.cpa} series={model.cpaSeries} hex={PLATFORM_META.google.hex} />
            </div>
          </Card>
        </>
      )}

      {/* ------------------------------------------------------------- CAMPANHAS */}
      {view === 'campaigns' && <CampaignsTable rows={model.byCampaign} />}

      {/* ------------------------------------------------------------- CRIATIVOS */}
      {view === 'creatives' && (
        <CreativesView creatives={creatives.filter((c) => platform === 'all' || c.platform === platform)} />
      )}

      {/* --------------------------------------------------------------- PÁGINAS */}
      {view === 'pages' && <PagesTable pages={pages} />}
    </div>
  )
}

/* --------------------------------------------------------- Custo (tendência) */

function CostTrend({ label, current, series, hex }: { label: string; current: number; series: number[]; hex: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-mono-label uppercase text-muted">{label}</span>
      <span className="font-display text-h2 font-semibold leading-none text-strong tabular-nums">{fmtMoneyCents(current)}</span>
      <Sparkbars data={series} hex={hex} />
    </div>
  )
}

/* ------------------------------------------------------------- Campanhas */

type CampaignRow = { campaign: Campaign } & Kpis

function CampaignsTable({ rows }: { rows: CampaignRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Megaphone size={20} strokeWidth={1.5} />} title="Nenhuma campanha com gasto" description="Ajuste o período ou a plataforma para ver campanhas ativas." />
      </Card>
    )
  }
  return (
    <Card padded={false} className="overflow-hidden">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Campanha</TableHeaderCell>
            <TableHeaderCell align="right">Investimento</TableHeaderCell>
            <TableHeaderCell align="right">Leads</TableHeaderCell>
            <TableHeaderCell align="right">CPL</TableHeaderCell>
            <TableHeaderCell align="right">CPC</TableHeaderCell>
            <TableHeaderCell align="right">CTR</TableHeaderCell>
            <TableHeaderCell align="right">ROAS</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => {
            const status = STATUS_META[r.campaign.status]
            return (
              <TableRow key={r.campaign.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="truncate text-body-s font-medium text-strong">{r.campaign.name}</span>
                    <div className="flex items-center gap-1.5">
                      <PlatformChip platform={r.campaign.platform} />
                      <Badge tone={status.tone} size="sm">{status.label}</Badge>
                      <span className="font-mono text-[11px] text-faint">{r.campaign.objective}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-strong">{fmtMoney(r.spend)}</span></TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-strong">{fmtInt(r.leads)}</span></TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-muted">{fmtMoneyCents(r.cpl)}</span></TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-muted">{fmtMoneyCents(r.cpc)}</span></TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-muted">{fmtPct(r.ctr)}</span></TableCell>
                <TableCell align="right">
                  {Number.isFinite(r.roas) ? (
                    <Badge tone={r.roas >= 2 ? 'success' : r.roas >= 1 ? 'warning' : 'danger'} size="sm">{fmtX(r.roas)}</Badge>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

/* ------------------------------------------------------------- Criativos */

const CREATIVE_SORTS = [
  { key: 'leads' as const, label: 'Mais leads' },
  { key: 'cpl' as const, label: 'Menor CPL' },
  { key: 'ctr' as const, label: 'Maior CTR' },
]
const TYPE_ICON: Record<CreativeType, React.ReactNode> = {
  static: <ImageIcon size={22} strokeWidth={1.5} />,
  video: <Video size={22} strokeWidth={1.5} />,
  carousel: <Images size={22} strokeWidth={1.5} />,
}

function creativeCpl(c: Creative) {
  return c.leads ? c.spend / c.leads : Infinity
}
function creativeCtr(c: Creative) {
  return c.impressions ? c.clicks / c.impressions : 0
}

function CreativesView({ creatives }: { creatives: Creative[] }) {
  const [sort, setSort] = useState<'leads' | 'cpl' | 'ctr'>('leads')

  const sortFn = (a: Creative, b: Creative): number => {
    if (sort === 'leads') return b.leads - a.leads
    if (sort === 'cpl') return creativeCpl(a) - creativeCpl(b)
    return creativeCtr(b) - creativeCtr(a)
  }

  const groups = (['video', 'static', 'carousel'] as CreativeType[])
    .map((type) => ({ type, items: creatives.filter((c) => c.type === type).sort(sortFn) }))
    .filter((g) => g.items.length > 0)

  if (creatives.length === 0) {
    return (
      <Card>
        <EmptyState icon={<ImageIcon size={20} strokeWidth={1.5} />} title="Nenhum criativo" description="Ajuste a plataforma para ver os criativos." />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-mono-label uppercase text-faint">{creatives.length} criativos · ordenar por</span>
        <Segmented options={CREATIVE_SORTS} value={sort} onChange={setSort} size="sm" />
      </div>
      {groups.map((g) => {
        const meta = CREATIVE_META[g.type]
        return (
          <Card key={g.type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span style={{ color: meta.hex }}>{TYPE_ICON[g.type]}</span>
                {meta.plural}
              </CardTitle>
              <span className="font-mono text-mono-label uppercase text-faint">{g.items.length}</span>
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.items.map((c, i) => (
                <CreativeCard key={c.id} creative={c} rank={i + 1} best={i === 0} />
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function CreativeCard({ creative: c, rank, best }: { creative: Creative; rank: number; best: boolean }) {
  const cpl = creativeCpl(c)
  const ctr = creativeCtr(c)
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border bg-slate-900', best ? 'border-steel-500/50 shadow-active' : 'border-line')}>
      {/* Thumbnail placeholder */}
      <div className="relative flex aspect-[4/3] items-center justify-center" style={{ backgroundColor: `${c.thumbHex}26` }}>
        <span style={{ color: c.thumbHex }}>{TYPE_ICON[c.type]}</span>
        <span className="absolute left-2 top-2"><PlatformChip platform={c.platform} /></span>
        {best && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-steel-500 px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent-fg">
            <Trophy size={11} strokeWidth={2} aria-hidden /> Top
          </span>
        )}
        <span className="absolute bottom-2 right-2 font-mono text-[10px] uppercase text-muted">#{rank}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <span className="line-clamp-2 text-body-s font-medium text-strong">{c.name}</span>
        <div className="mt-auto grid grid-cols-2 gap-y-2 gap-x-3">
          <Metric icon={<Banknote size={12} strokeWidth={1.5} />} label="Invest." value={fmtMoney(c.spend)} />
          <Metric icon={<Users size={12} strokeWidth={1.5} />} label="Leads" value={fmtInt(c.leads)} />
          <Metric icon={<Target size={12} strokeWidth={1.5} />} label="CPL" value={fmtMoneyCents(cpl)} />
          <Metric
            icon={c.videoViews != null ? <Eye size={12} strokeWidth={1.5} /> : <MousePointerClick size={12} strokeWidth={1.5} />}
            label={c.videoViews != null ? 'Views' : 'CTR'}
            value={c.videoViews != null ? fmtCompact(c.videoViews) : fmtPct(ctr)}
          />
        </div>
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-faint">
        <span className="text-faint" aria-hidden>{icon}</span>
        {label}
      </span>
      <span className="font-mono text-mono-data tabular-nums text-strong">{value}</span>
    </div>
  )
}

/* --------------------------------------------------------------- Páginas */

function PagesTable({ pages }: { pages: { id: string; name: string; url: string; visits: number; leads: number; spend: number }[] }) {
  const rows = [...pages].sort((a, b) => b.leads - a.leads)
  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Globe size={20} strokeWidth={1.5} />} title="Nenhuma página" description="Sem páginas de captura cadastradas." />
      </Card>
    )
  }
  return (
    <Card padded={false} className="overflow-hidden">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Página</TableHeaderCell>
            <TableHeaderCell align="right">Visitas</TableHeaderCell>
            <TableHeaderCell align="right">Leads</TableHeaderCell>
            <TableHeaderCell align="right">Conversão</TableHeaderCell>
            <TableHeaderCell align="right">Investimento</TableHeaderCell>
            <TableHeaderCell align="right">CPL</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((p) => {
            const conv = p.visits ? p.leads / p.visits : 0
            const cpl = p.leads ? p.spend / p.leads : NaN
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800 text-muted">
                      <Globe size={15} strokeWidth={1.5} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-body-s font-medium text-strong">{p.name}</div>
                      <div className="truncate font-mono text-[11px] text-faint">{p.url}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-muted">{fmtInt(p.visits)}</span></TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-strong">{fmtInt(p.leads)}</span></TableCell>
                <TableCell align="right">
                  <Badge tone={conv >= 0.3 ? 'success' : conv >= 0.15 ? 'warning' : 'neutral'} size="sm">{fmtPct(conv)}</Badge>
                </TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-muted">{fmtMoney(p.spend)}</span></TableCell>
                <TableCell align="right"><span className="font-mono tabular-nums text-strong">{fmtMoneyCents(cpl)}</span></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
