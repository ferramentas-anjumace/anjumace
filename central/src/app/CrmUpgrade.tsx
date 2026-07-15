import { useMemo, useState } from 'react'
import { ArrowUpRight, MessageCircle, Sparkles } from 'lucide-react'
import { StatCard, Button, EmptyState, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { useCatalogs, CatalogBadge } from './catalogs'
import { useCrm, fmtBRL, fmtDateBR, waHref, isWon, isLost, isClosed, type Lead } from './crm'
import { planOf } from './csPlaybook'

/* ----------------------------------------------------------------------------
   CRM · Upgrade — esteira Templo → Singular
   ----------------------------------------------------------------------------
   Pedido da All Hands: converter alunas do Templo pro Singular aproveitando o
   relacionamento já construído. Cada upgrade é um NOVO lead no pipeline,
   vinculado à aluna de origem por upgradeFrom — assim a candidata não é
   oferecida duas vezes e a conversão da esteira é medida de ponta a ponta.
---------------------------------------------------------------------------- */

export function CrmUpgrade({ canManage, onOpen }: { canManage: boolean; onOpen: (id: string) => void }) {
  const { toast } = useToast()
  const { user } = useSession()
  const { leads, addLead } = useCrm()
  const { items, tone, label } = useCatalogs()
  const [creating, setCreating] = useState<string | null>(null)

  const data = useMemo(() => {
    // Alunas ganhas no Templo — a base da esteira.
    const alunasTemplo = leads.filter((l) => isWon(l.status) && planOf(l.product) === 'templo' && !l.upgradeFrom)
    // Leads de upgrade já abertos, indexados pela aluna de origem.
    const upgrades = leads.filter((l) => l.upgradeFrom)
    const upgradeByFrom = new Map(upgrades.map((l) => [l.upgradeFrom as string, l]))

    const candidatas = alunasTemplo.filter((a) => !upgradeByFrom.has(a.id))
    const emAndamento = upgrades.filter((l) => !isClosed(l.status))
    const ganhos = upgrades.filter((l) => isWon(l.status))
    const perdidos = upgrades.filter((l) => isLost(l.status))
    const conversion = ganhos.length + perdidos.length > 0
      ? Math.round((ganhos.length / (ganhos.length + perdidos.length)) * 100)
      : null
    const ganhoValue = ganhos.reduce((s, l) => s + (l.potentialValue || 0), 0)

    return { candidatas, emAndamento, upgradeByFrom, ganhos, conversion, ganhoValue }
  }, [leads])

  // Valor do catálogo que representa o Singular (o gestor pode renomear;
  // a convenção é manter "Singular" no nome — mesma regra dos status).
  const singularValue = items('crm_product').find((p) => planOf(p.value) === 'singular')?.value ?? 'Singular'

  const startUpgrade = async (aluna: Lead) => {
    setCreating(aluna.id)
    const { id, error } = await addLead({
      name: aluna.name,
      whatsapp: aluna.whatsapp,
      email: aluna.email,
      product: singularValue,
      origin: 'Upgrade',
      status: 'Novo',
      ownerId: user.id,
      upgradeFrom: aluna.id,
      notes: `Esteira de upgrade Templo → Singular. Aluna desde ${fmtDateBR(aluna.closedAt?.slice(0, 10) ?? aluna.createdAt.slice(0, 10))}.`,
    })
    setCreating(null)
    if (error) { toast({ title: 'Erro ao abrir o upgrade', description: error, tone: 'error' }); return }
    toast({ title: 'Upgrade aberto', description: `${aluna.name} entrou no pipeline como oportunidade Singular.`, tone: 'success' })
    if (id) onOpen(id)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs da esteira */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Candidatas (Templo)" value={data.candidatas.length} />
        <StatCard label="Upgrades em andamento" value={data.emAndamento.length} />
        <StatCard label="Upgrades ganhos" value={`${data.ganhos.length}${data.ganhoValue > 0 ? ` · ${fmtBRL(data.ganhoValue)}` : ''}`} active={data.ganhos.length > 0} />
        <StatCard label="Conversão da esteira" value={data.conversion === null ? '—' : `${data.conversion}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Candidatas */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-mono-label uppercase text-muted">Candidatas a upgrade</span>
            <span className="font-mono text-mono-data text-faint tabular-nums">{data.candidatas.length}</span>
          </div>
          <p className="text-body-s text-faint">
            Alunas ganhas no Templo sem oportunidade Singular aberta. "Iniciar upgrade" cria o lead no pipeline já vinculado à aluna.
          </p>
          {data.candidatas.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent"
              icon={<Sparkles size={22} strokeWidth={1.5} />}
              title="Nenhuma candidata no momento"
              description="Quando uma venda do Templo fechar no CRM, a aluna aparece aqui."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {data.candidatas.map((a) => {
                const wa = waHref(a.whatsapp)
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-line bg-ink-deep/40 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-body-s font-medium text-strong">{a.name}</span>
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir no WhatsApp"
                            aria-label={`WhatsApp de ${a.name}`}
                            className="inline-flex shrink-0 items-center text-ok transition-colors hover:text-ok/70 focus-visible:outline-none focus-visible:shadow-focus"
                          >
                            <MessageCircle size={14} strokeWidth={1.5} aria-hidden />
                          </a>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-faint">
                        Aluna desde {fmtDateBR((a.closedAt ?? a.createdAt).slice(0, 10))}
                        {a.potentialValue > 0 && ` · ${fmtBRL(a.potentialValue)}`}
                      </span>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={creating === a.id}
                        leftIcon={<ArrowUpRight size={15} strokeWidth={1.5} />}
                        onClick={() => startUpgrade(a)}
                      >
                        Iniciar upgrade
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Em andamento / desfechos */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-mono-label uppercase text-muted">Esteira em andamento</span>
            <span className="font-mono text-mono-data text-faint tabular-nums">{data.emAndamento.length}</span>
          </div>
          <p className="text-body-s text-faint">
            Oportunidades Singular abertas pela esteira — acompanhe e mova no pipeline como qualquer lead.
          </p>
          {data.emAndamento.length === 0 ? (
            <p className="py-6 text-center text-body-s text-faint">Nenhum upgrade em andamento.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.emAndamento.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onOpen(l.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-line bg-ink-deep/40 px-3 py-2.5 text-left transition-colors',
                    'hover:border-strong focus-visible:outline-none focus-visible:shadow-focus',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-body-s font-medium text-strong">{l.name}</span>
                    <span className="font-mono text-[11px] text-faint">
                      aberto em {fmtDateBR(l.createdAt.slice(0, 10))}
                      {l.potentialValue > 0 && ` · ${fmtBRL(l.potentialValue)}`}
                    </span>
                  </div>
                  <CatalogBadge tone={tone('crm_status', l.status)} size="sm">{label('crm_status', l.status)}</CatalogBadge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
