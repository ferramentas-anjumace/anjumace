import { useEffect, useState } from 'react'
import { Archive, CalendarPlus, Pencil, Plus, Trash2, MoreHorizontal } from 'lucide-react'
import {
  Drawer, Modal, Button, Input, Textarea, DatePicker, Select, EmptyState,
  IconButton, DropdownMenu, MenuItem, MenuSeparator, useToast,
} from '@/components/ui'
import { useCatalogs, CatalogBadge } from './catalogs'
import { useEditorial, type EditorialIdea, type EditorialIdeaInput } from './editorial'
import { formatDefaults } from './data'

/* ----------------------------------------------------------------------------
   Editorial · Gaveta de conteúdos
   ----------------------------------------------------------------------------
   Ideias e roteiros SEM data — o estoque que alimenta o calendário. "Agendar"
   transforma a ideia em post: o roteiro entra como copy, o formato pré-preenche
   os padrões (tipo, canais, pendências) e a ideia sai da gaveta.
---------------------------------------------------------------------------- */

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function EditorialGaveta({
  clientId, open, canManage, onClose, onOpenPost,
}: {
  clientId: string
  open: boolean
  canManage: boolean
  onClose: () => void
  onOpenPost: (postId: string) => void
}) {
  const toast = useToast()
  const { items, tone, label } = useCatalogs()
  const { getIdeas, addIdea, updateIdea, removeIdea, addPost } = useEditorial()
  const ideas = getIdeas(clientId)
  const formats = items('editorial_format')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditorialIdea | null>(null)
  const [scheduling, setScheduling] = useState<EditorialIdea | null>(null)

  const handleSave = async (input: EditorialIdeaInput) => {
    if (!input.title.trim()) { toast.error('Dê um título pra ideia'); return }
    const { error } = editing ? await updateIdea(editing.id, input) : await addIdea(clientId, input)
    if (error) { toast.error('Falha ao salvar', error); return }
    toast.success(editing ? 'Ideia atualizada' : 'Ideia guardada na gaveta', input.title)
    setFormOpen(false)
    setEditing(null)
  }

  const handleDelete = async (idea: EditorialIdea) => {
    await removeIdea(idea.id)
    toast.success('Ideia removida', idea.title)
  }

  const handleSchedule = async (idea: EditorialIdea, dateIso: string, time: string) => {
    const format = idea.format || formats[0]?.value || 'carrossel'
    const defaults = formatDefaults(format)
    const id = await addPost(clientId, {
      date: dateIso,
      publishTime: time || undefined,
      title: idea.title,
      format,
      channels: defaults.channels,
      stage: defaults.stage,
      approval: 'em-producao',
      copy: idea.script ?? undefined,
      pending: defaults.pending,
      ready: [],
      cards: [],
    })
    if (!id) { toast.error('Não foi possível agendar'); return }
    await removeIdea(idea.id)
    setScheduling(null)
    toast.success('Ideia agendada', `${idea.title} entrou no calendário.`)
    onClose()
    onOpenPost(id)
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Gaveta de conteúdos"
        description="Ideias e roteiros sem data — agende quando chegar a hora."
        width={440}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            {canManage ? (
              <Button size="sm" leftIcon={<Plus size={15} strokeWidth={1.5} />} onClick={() => { setEditing(null); setFormOpen(true) }}>
                Nova ideia
              </Button>
            ) : <span />}
            <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
          </div>
        }
      >
        {ideas.length === 0 ? (
          <EmptyState
            icon={<Archive size={22} strokeWidth={1.5} />}
            title="Gaveta vazia"
            description="Guarde aqui roteiros e ideias de conteúdo pra agendar depois."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {ideas.map((idea) => (
              <div key={idea.id} className="flex flex-col gap-2 rounded-lg border border-line bg-slate-900 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-body-s font-medium text-strong">{idea.title}</span>
                  {canManage && (
                    <DropdownMenu
                      align="end"
                      trigger={
                        <IconButton size="sm" aria-label={`Ações de ${idea.title}`}>
                          <MoreHorizontal size={16} strokeWidth={1.5} />
                        </IconButton>
                      }
                    >
                      <MenuItem icon={<CalendarPlus size={16} strokeWidth={1.5} />} onClick={() => setScheduling(idea)}>
                        Agendar no calendário
                      </MenuItem>
                      <MenuItem icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => { setEditing(idea); setFormOpen(true) }}>
                        Editar
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem icon={<Trash2 size={16} strokeWidth={1.5} />} destructive onClick={() => handleDelete(idea)}>
                        Excluir
                      </MenuItem>
                    </DropdownMenu>
                  )}
                </div>
                {idea.script && <p className="line-clamp-3 whitespace-pre-line text-body-s text-muted">{idea.script}</p>}
                <div className="flex items-center justify-between gap-2">
                  {idea.format ? (
                    <CatalogBadge size="sm" tone={tone('editorial_format', idea.format)}>
                      {label('editorial_format', idea.format)}
                    </CatalogBadge>
                  ) : <span />}
                  {canManage && (
                    <Button size="sm" variant="secondary" leftIcon={<CalendarPlus size={14} strokeWidth={1.5} />} onClick={() => setScheduling(idea)}>
                      Agendar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <IdeaFormModal
        open={formOpen}
        editing={editing}
        formats={formats.map((f) => ({ value: f.value, label: f.label }))}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
      />

      <ScheduleModal
        idea={scheduling}
        onClose={() => setScheduling(null)}
        onSchedule={handleSchedule}
      />
    </>
  )
}

/* ------------------------------------------------------------- formulário */

function IdeaFormModal({
  open, editing, formats, onClose, onSave,
}: {
  open: boolean
  editing: EditorialIdea | null
  formats: { value: string; label: string }[]
  onClose: () => void
  onSave: (input: EditorialIdeaInput) => void
}) {
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState('')
  const [script, setScript] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(editing?.title ?? '')
    setFormat(editing?.format ?? '')
    setScript(editing?.script ?? '')
  }, [open, editing])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar ideia' : 'Nova ideia'}
      description="Guarde o roteiro na gaveta — sem data, sem pressa."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ title, format: format || null, script: script || null })}>
            {editing ? 'Salvar' : 'Guardar na gaveta'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: 5 sinais de que seu treino não respeita seu corpo" autoFocus />
        <Select label="Formato" value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="">— Definir depois —</option>
          {formats.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-mono-label uppercase text-muted">Roteiro / esboço</span>
          <Textarea rows={8} value={script} onChange={(e) => setScript(e.target.value)} placeholder="Roteiro, estrutura ou rascunho da copy — vira a copy do post ao agendar." />
        </label>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------- agendamento */

/** Janelas de pico do relatório do Evandro (All Hands 14/07). */
const PEAK_HINT = 'Picos de engajamento: 7–8h · 11–12h · 20–21h'

function ScheduleModal({
  idea, onClose, onSchedule,
}: {
  idea: EditorialIdea | null
  onClose: () => void
  onSchedule: (idea: EditorialIdea, dateIso: string, time: string) => void
}) {
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState('')

  useEffect(() => {
    if (idea) { setDate(new Date()); setTime('07:30') }
  }, [idea])

  if (!idea) return <Modal open={false} onClose={onClose} title="Agendar" />

  return (
    <Modal
      open
      onClose={onClose}
      title={`Agendar "${idea.title}"`}
      description="A ideia vira um post do calendário; o roteiro entra como copy."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => date && onSchedule(idea, toISO(date), time)}>Agendar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-mono-label uppercase text-muted">Data de publicação</span>
          <DatePicker value={date} onChange={setDate} />
        </label>
        <Input label="Horário" type="time" value={time} onChange={(e) => setTime(e.target.value)} helperText={PEAK_HINT} />
      </div>
    </Modal>
  )
}
