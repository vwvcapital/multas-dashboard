import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Multa } from '@/lib/supabase'
import type { Permissions } from '@/contexts/AuthContext'
import {
  Truck,
  User,
  Calendar,
  Eye,
  Pencil,
  Search,
  FileText,
  StickyNote,
  Tag,
  Plus,
  X,
  Check,
  DollarSign,
  Hash,
} from 'lucide-react'

// Configuração das colunas do Kanban
const KANBAN_COLUMNS = [
  {
    id: 'Vencido',
    label: 'Vencido',
    color: 'bg-red-500',
    lightBg: 'bg-red-50 dark:bg-red-950/15',
    borderColor: 'border-red-200 dark:border-red-900',
    textColor: 'text-red-700 dark:text-red-400',
    badgeVariant: 'destructive' as const,
    gradient: 'bg-gradient-to-r from-red-400 to-rose-500',
    cardBg: 'bg-red-50/40 dark:bg-red-950/20',
    cardBorder: 'border-red-100 dark:border-red-900/50',
    iconBg: 'bg-red-50 dark:bg-red-950/30',
    iconText: 'text-red-600 dark:text-red-400',
    buttonBg: 'bg-red-500',
    buttonHover: 'hover:bg-red-600',
  },
  {
    id: 'Pendente',
    label: 'Pendente',
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50 dark:bg-amber-950/15',
    borderColor: 'border-amber-200 dark:border-amber-900',
    textColor: 'text-amber-700 dark:text-amber-400',
    badgeVariant: 'warning' as const,
    gradient: 'bg-gradient-to-r from-amber-400 to-orange-400',
    cardBg: 'bg-amber-50/40 dark:bg-amber-950/20',
    cardBorder: 'border-amber-100 dark:border-amber-900/50',
    iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    buttonBg: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-600',
  },
  {
    id: 'Disponível',
    label: 'Disponível',
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/15',
    borderColor: 'border-blue-200 dark:border-blue-900',
    textColor: 'text-blue-700 dark:text-blue-400',
    badgeVariant: 'default' as const,
    gradient: 'bg-gradient-to-r from-blue-400 to-indigo-400',
    cardBg: 'bg-blue-50/40 dark:bg-blue-950/20',
    cardBorder: 'border-blue-100 dark:border-blue-900/50',
    iconBg: 'bg-blue-50 dark:bg-blue-950/30',
    iconText: 'text-blue-600 dark:text-blue-400',
    buttonBg: 'bg-blue-500',
    buttonHover: 'hover:bg-blue-600',
  },
  {
    id: 'Concluído',
    label: 'Concluído',
    color: 'bg-slate-500',
    lightBg: 'bg-slate-50 dark:bg-neutral-950/30',
    borderColor: 'border-slate-200 dark:border-neutral-800',
    textColor: 'text-slate-700 dark:text-neutral-400',
    badgeVariant: 'secondary' as const,
    gradient: 'bg-gradient-to-r from-slate-400 to-slate-500',
    cardBg: 'bg-slate-50/40 dark:bg-neutral-950/40',
    cardBorder: 'border-slate-100 dark:border-neutral-800/60',
    iconBg: 'bg-slate-100 dark:bg-neutral-900/50',
    iconText: 'text-slate-600 dark:text-neutral-400',
    buttonBg: 'bg-slate-500',
    buttonHover: 'hover:bg-slate-600',
  },
]

const INITIAL_VISIBLE_PER_COLUMN = 10
const LOAD_MORE_STEP = 10

type KanbanSortOption =
  | 'cadastradas-recente'
  | 'cadastradas-antiga'
  | 'editadas-recente'
  | 'cometimento-recente'
  | 'cometimento-antiga'
  | 'valor-maior'
  | 'valor-menor'
  | 'veiculo'
  | 'motorista'

type ResponsibilityFilter = 'todos' | 'motorista' | 'empresa'

// Função para converter valor string "R$ 260,32" para número
function parseValor(valor: string): number {
  if (!valor) return 0
  return parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
}

function parseData(data?: string): number {
  if (!data) return 0
  const [dia, mes, ano] = data.split('/')
  const parsed = new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

// Cores predefinidas para tags
const TAG_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-indigo-100 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-teal-100 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  { bg: 'bg-violet-100 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  { bg: 'bg-slate-100 dark:bg-neutral-900/50', text: 'text-slate-700 dark:text-neutral-300', border: 'border-slate-200 dark:border-neutral-700' },
]

const TAG_COLOR_OVERRIDES: Record<string, { bg: string; text: string; border: string }> = {
  pago: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  parcelado: { bg: 'bg-yellow-100 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  indicado: { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'joao paulo': { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  rh: { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
}

function getTagColor(tag: string) {
  const normalized = (tag || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const overrideColor = TAG_COLOR_OVERRIDES[normalized]
  if (overrideColor) {
    return overrideColor
  }

  let hash = 0
  for (let index = 0; index < normalized.length; index++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index)
    hash |= 0
  }
  const colorIndex = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[colorIndex]
}

// Inline tag input mini-component
function TagInput({ onAdd, onClose }: { onAdd: (tag: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onAdd(trimmed)
      setValue('')
    }
  }

  return (
    <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') onClose()
        }}
        placeholder="Nova tag..."
        className="h-6 px-2 text-[11px] border border-slate-200 rounded-md bg-white focus:outline-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-primary/40 w-24"
      />
      <button
        onClick={handleSubmit}
        className="h-6 w-6 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        onClick={onClose}
        className="h-6 w-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// Card compacto para o Kanban — redesenhado com ênfase em Notas, Placa, Auto, Motorista, Tags
function KanbanCard({
  multa,
  nota,
  tags,
  columnColors,
  onDragStart,
  onDragEnd,
  isDragging,
  onViewDetails,
  onAddTag,
  onRemoveTag,
  onQuickEditNote,
}: {
  multa: Multa
  nota: string
  tags: string[]
  columnColors: {
    gradient: string
    cardBg: string
    cardBorder: string
    iconBg: string
    iconText: string
    buttonBg: string
    buttonHover: string
  }
  onDragStart: (e: React.DragEvent, multa: Multa) => void
  onDragEnd: () => void
  isDragging: boolean
  onViewDetails?: (multa: Multa) => void
  onAddTag: (multaId: number, tag: string) => Promise<boolean>
  onRemoveTag: (multaId: number, tag: string) => Promise<boolean>
  onQuickEditNote?: (multaId: number, nota: string) => Promise<boolean>
}) {
  const [showTagInput, setShowTagInput] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(nota || '')
  const [isSavingNote, setIsSavingNote] = useState(false)

  useEffect(() => {
    if (!isEditingNote) {
      setNoteDraft(nota || '')
    }
  }, [nota, isEditingNote])

  const handleSaveNote = async () => {
    if (!onQuickEditNote) return
    setIsSavingNote(true)
    try {
      const success = await onQuickEditNote(multa.id, noteDraft)
      if (success) {
        setIsEditingNote(false)
      }
    } finally {
      setIsSavingNote(false)
    }
  }

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, multa)}
        onDragEnd={onDragEnd}
        className={`group ${columnColors.cardBg} rounded-xl border-2 ${columnColors.cardBorder} cursor-grab active:cursor-grabbing h-[390px] flex flex-col
          transition-all duration-200 hover:shadow-md hover:border-slate-200 dark:hover:border-neutral-700 overflow-hidden
          ${isDragging ? 'opacity-40 scale-95 rotate-1 shadow-2xl' : 'opacity-100'}`}
      >
      {/* Top color bar */}
      <div className={`h-1.5 ${columnColors.gradient}`} />

      <div className="p-3 flex-1 flex flex-col min-h-0">
        {/* Header — Grip + Placa */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${columnColors.iconBg} shrink-0`}>
            <Truck className={`h-3.5 w-3.5 ${columnColors.iconText}`} />
          </div>
          <span className="font-extrabold text-base text-slate-900 dark:text-neutral-100 tracking-tight truncate">{multa.Veiculo}</span>
        </div>

        {/* Auto de Infração */}
        <div className="flex items-center gap-1.5 mb-2 text-xs">
          <Hash className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-mono font-semibold text-slate-500 tracking-wide truncate">{multa.Auto_Infracao}</span>
        </div>

        {/* Motorista */}
        <div className="flex items-center gap-1.5 mb-2 text-xs">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-700 dark:text-neutral-300 font-medium truncate">{multa.Motorista}</span>
        </div>

        {/* Responsabilidade */}
        <div className="mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            (multa.Resposabilidade || '').toLowerCase() === 'motorista'
              ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
              : (multa.Resposabilidade || '').toLowerCase() === 'empresa'
                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-900/50 dark:text-neutral-300 dark:border-neutral-700'
          }`}>
            {(multa.Resposabilidade || 'Sem responsabilidade').toUpperCase()}
          </span>
        </div>

        {/* Data + Valor */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {multa.Data_Cometimento}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold ml-auto">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            {multa.Valor_Boleto || multa.Valor}
          </span>
        </div>

        {/* Notas (destaque grande) */}
        <div className="mb-3 p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <StickyNote className="h-3 w-3 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400">Nota</span>
            </div>
            {onQuickEditNote && !isEditingNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingNote(true)
                }}
                className="h-6 w-6 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors inline-flex items-center justify-center"
                title="Editar nota"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>

          {nota ? (
            <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed line-clamp-3">{nota}</p>
          ) : (
            <div className="space-y-1.5 py-0.5">
              <div className="h-2 rounded bg-slate-200/80 dark:bg-neutral-800/60 w-[92%]" />
              <div className="h-2 rounded bg-slate-200/80 dark:bg-neutral-800/60 w-[86%]" />
              <div className="h-2 rounded bg-slate-200/80 dark:bg-neutral-800/60 w-[74%]" />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mb-3">
          <div className="flex items-center flex-wrap gap-1">
            {tags.map((tag) => {
              const color = getTagColor(tag)
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color.bg} ${color.text} ${color.border}`}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveTag(multa.id, tag) }}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )
            })}
            {!showTagInput && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowTagInput(true) }}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border border-dashed border-slate-300 dark:border-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all"
                title="Adicionar tag"
              >
                <Plus className="h-2.5 w-2.5" />
                Tag
              </button>
            )}
          </div>
          {showTagInput && (
            <TagInput
              onAdd={async (tag) => {
                const success = await onAddTag(multa.id, tag)
                if (success) {
                  setShowTagInput(false)
                }
              }}
              onClose={() => setShowTagInput(false)}
            />
          )}
        </div>

        {/* Footer — Botão detalhes proeminente */}
        {onViewDetails && (
          <div className="mt-auto">
            <Button
              variant="default"
              size="sm"
              className={`w-full h-8 text-xs gap-1.5 font-semibold text-white shadow-md ${columnColors.buttonBg} ${columnColors.buttonHover}`}
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(multa)
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              Ver Detalhes
            </Button>
          </div>
        )}
      </div>
      </div>

      {isEditingNote && onQuickEditNote && (
        <div
          className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => {
            if (isSavingNote) return
            setNoteDraft(nota || '')
            setIsEditingNote(false)
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 dark:bg-neutral-950 dark:border-neutral-700 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">Editar nota da multa</h3>
            <p className="text-xs text-slate-500 mt-1 truncate">{multa.Veiculo} • {multa.Auto_Infracao}</p>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 min-w-0">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{multa.Motorista || 'Sem motorista'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{multa.Data_Cometimento || 'Sem data'}</span>
              </div>
            </div>

            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-700">
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
                <Tag className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
                Tags
              </div>
              <div className="flex items-center flex-wrap gap-1">
                {tags.length > 0 ? (
                  tags.map((tag) => {
                    const color = getTagColor(tag)
                    return (
                      <span
                        key={`modal-tag-${multa.id}-${tag}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color.bg} ${color.text} ${color.border}`}
                      >
                        {tag}
                      </span>
                    )
                  })
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Sem tags</span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={10}
                className="w-full min-h-[300px] rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 resize-y focus:outline-none focus:ring-1 focus:ring-amber-300"
                placeholder="Digite uma nota..."
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setNoteDraft(nota || '')
                    setIsEditingNote(false)
                  }}
                  className="h-8 px-3 rounded-md text-xs font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                  disabled={isSavingNote}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNote}
                  className="h-8 px-3 rounded-md text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
                  disabled={isSavingNote}
                >
                  {isSavingNote ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface KanbanBoardProps {
  multas: Multa[]
  tagsByMultaId: Record<number, string[]>
  editedAtByMultaId: Record<number, number>
  onAddTag: (multaId: number, tag: string) => Promise<boolean>
  onRemoveTag: (multaId: number, tag: string) => Promise<boolean>
  onUpdateStatus: (multaId: number, newStatus: string) => Promise<boolean>
  onQuickEditNote?: (multaId: number, nota: string) => Promise<boolean>
  onViewDetails?: (multa: Multa) => void
  permissions?: Permissions
}

export function KanbanBoard({ multas, tagsByMultaId, editedAtByMultaId, onAddTag, onRemoveTag, onUpdateStatus, onQuickEditNote, onViewDetails, permissions }: KanbanBoardProps) {
  const [draggingMulta, setDraggingMulta] = useState<Multa | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [pendingStatusChange, setPendingStatusChange] = useState<{ multa: Multa; targetStatus: string } | null>(null)
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [responsibilityFilter, setResponsibilityFilter] = useState<ResponsibilityFilter>('todos')
  const [sortOption, setSortOption] = useState<KanbanSortOption>('editadas-recente')
  const [localNotesById, setLocalNotesById] = useState<Record<number, string>>({})
  const [editedAtById, setEditedAtById] = useState<Record<number, number>>({})
  const [visibleByStatus, setVisibleByStatus] = useState<Record<string, number>>(
    () => KANBAN_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: INITIAL_VISIBLE_PER_COLUMN }), {})
  )
  const dragCounterRef = useRef<Record<string, number>>({})

  useEffect(() => {
    setVisibleByStatus((prev) => {
      const next = { ...prev }
      for (const col of KANBAN_COLUMNS) {
        const current = next[col.id] ?? INITIAL_VISIBLE_PER_COLUMN
        next[col.id] = Math.max(INITIAL_VISIBLE_PER_COLUMN, current)
      }
      return next
    })
  }, [multas])

  const handleQuickEditNote = useCallback(async (multaId: number, nota: string) => {
    if (!onQuickEditNote) return false
    const success = await onQuickEditNote(multaId, nota)
    if (success) {
      setLocalNotesById((prev) => ({ ...prev, [multaId]: nota }))
      setEditedAtById((prev) => ({ ...prev, [multaId]: Date.now() }))
    }
    return success
  }, [onQuickEditNote])

  const handleAddTag = useCallback(async (multaId: number, tag: string) => {
    const success = await onAddTag(multaId, tag)
    if (success) {
      setEditedAtById((prev) => ({ ...prev, [multaId]: Date.now() }))
    }
    return success
  }, [onAddTag])

  const handleRemoveTag = useCallback(async (multaId: number, tag: string) => {
    const success = await onRemoveTag(multaId, tag)
    if (success) {
      setEditedAtById((prev) => ({ ...prev, [multaId]: Date.now() }))
    }
    return success
  }, [onRemoveTag])

  const handleLoadMore = useCallback((status: string) => {
    setVisibleByStatus((prev) => ({
      ...prev,
      [status]: (prev[status] ?? INITIAL_VISIBLE_PER_COLUMN) + LOAD_MORE_STEP,
    }))
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, multa: Multa) => {
    setDraggingMulta(multa)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(multa.id))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingMulta(null)
    setDragOverColumn(null)
    dragCounterRef.current = {}
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (!dragCounterRef.current[columnId]) dragCounterRef.current[columnId] = 0
    dragCounterRef.current[columnId]++
    setDragOverColumn(columnId)
  }, [])

  const handleDragLeave = useCallback((columnId: string) => {
    if (!dragCounterRef.current[columnId]) dragCounterRef.current[columnId] = 0
    dragCounterRef.current[columnId]--
    if (dragCounterRef.current[columnId] <= 0) {
      dragCounterRef.current[columnId] = 0
      setDragOverColumn((prev) => (prev === columnId ? null : prev))
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetStatus: string) => {
      e.preventDefault()
      setDragOverColumn(null)
      dragCounterRef.current = {}

      if (!draggingMulta) return
      if (draggingMulta.Status_Boleto === targetStatus) {
        setDraggingMulta(null)
        return
      }

      setPendingStatusChange({ multa: draggingMulta, targetStatus })
      setDraggingMulta(null)
    },
    [draggingMulta]
  )

  const handleConfirmStatusChange = useCallback(async () => {
    if (!pendingStatusChange) return

    const { multa, targetStatus } = pendingStatusChange
    setIsConfirmingStatus(true)
    setUpdatingId(multa.id)
    try {
      const success = await onUpdateStatus(multa.id, targetStatus)
      if (success) {
        setEditedAtById((prev) => ({ ...prev, [multa.id]: Date.now() }))
        setPendingStatusChange(null)
      }
    } finally {
      setIsConfirmingStatus(false)
      setUpdatingId(null)
    }
  }, [onUpdateStatus, pendingStatusChange])

  const handleCancelStatusChange = useCallback(() => {
    if (isConfirmingStatus) return
    setPendingStatusChange(null)
  }, [isConfirmingStatus])

  // Filtro de pesquisa no Kanban
  const filteredMultas = multas.filter((multa) => {
    const responsabilidade = (multa.Resposabilidade || '').trim().toLowerCase()
    const matchesResponsabilidade =
      responsibilityFilter === 'todos' ||
      (responsibilityFilter === 'motorista' && responsabilidade === 'motorista') ||
      (responsibilityFilter === 'empresa' && responsabilidade === 'empresa')

    if (!matchesResponsabilidade) return false

    const term = searchTerm.trim().toLowerCase()
    if (!term) return true

    const tags = tagsByMultaId[multa.id] || []
    const matchesTag = tags.some((tag) => (tag || '').toLowerCase().includes(term))

    return (
      (multa.Veiculo || '').toLowerCase().includes(term) ||
      (multa.Auto_Infracao || '').toLowerCase().includes(term) ||
      (multa.Motorista || '').toLowerCase().includes(term) ||
      (multa.Descricao || '').toLowerCase().includes(term) ||
      (multa.Codigo_Infracao ? String(multa.Codigo_Infracao) : '').toLowerCase().includes(term) ||
      matchesTag
    )
  })

  // Group multas by status
  const multasByStatus: Record<string, Multa[]> = {}
  for (const col of KANBAN_COLUMNS) {
    multasByStatus[col.id] = filteredMultas.filter((m) => m.Status_Boleto === col.id)
  }

  const sortMultas = useCallback((items: Multa[]) => {
    const sorted = [...items]

    switch (sortOption) {
      case 'cadastradas-recente':
        return sorted.sort((a, b) => b.id - a.id)
      case 'cadastradas-antiga':
        return sorted.sort((a, b) => a.id - b.id)
      case 'editadas-recente':
        return sorted.sort((a, b) => {
          const editedB = editedAtById[b.id] || editedAtByMultaId[b.id] || 0
          const editedA = editedAtById[a.id] || editedAtByMultaId[a.id] || 0
          return (editedB - editedA) || (b.id - a.id)
        })
      case 'cometimento-recente':
        return sorted.sort((a, b) => parseData(b.Data_Cometimento) - parseData(a.Data_Cometimento))
      case 'cometimento-antiga':
        return sorted.sort((a, b) => parseData(a.Data_Cometimento) - parseData(b.Data_Cometimento))
      case 'valor-maior':
        return sorted.sort((a, b) => parseValor(b.Valor_Boleto || b.Valor) - parseValor(a.Valor_Boleto || a.Valor))
      case 'valor-menor':
        return sorted.sort((a, b) => parseValor(a.Valor_Boleto || a.Valor) - parseValor(b.Valor_Boleto || b.Valor))
      case 'veiculo':
        return sorted.sort((a, b) => (a.Veiculo || '').localeCompare(b.Veiculo || ''))
      case 'motorista':
        return sorted.sort((a, b) => (a.Motorista || '').localeCompare(b.Motorista || ''))
      default:
        return sorted.sort((a, b) => b.id - a.id)
    }
  }, [sortOption, editedAtById, editedAtByMultaId])

  const sortOptions = [
    { value: 'editadas-recente', label: 'Recentemente editadas' },
    { value: 'cadastradas-recente', label: 'Recentemente cadastradas' },
    { value: 'cadastradas-antiga', label: 'Cadastradas mais antigas' },
    { value: 'cometimento-recente', label: 'Cometimento mais recente' },
    { value: 'cometimento-antiga', label: 'Cometimento mais antigo' },
    { value: 'valor-maior', label: 'Maior valor' },
    { value: 'valor-menor', label: 'Menor valor' },
    { value: 'veiculo', label: 'Veículo (A-Z)' },
    { value: 'motorista', label: 'Motorista (A-Z)' },
  ]

  // Calculate totals per column
  const columnTotals: Record<string, number> = {}
  for (const col of KANBAN_COLUMNS) {
    columnTotals[col.id] = multasByStatus[col.id].reduce(
      (sum, m) => sum + parseValor(m.Valor_Boleto || m.Valor),
      0
    )
  }

  const formatValorDisplay = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

  const getColumnById = useCallback((id: string) => KANBAN_COLUMNS.find((col) => col.id === id), [])

  // Check if a drop is allowed for visual feedback (livre entre todos os status)
  const isDropAllowed = (columnId: string) => {
    if (!draggingMulta) return false
    return draggingMulta.Status_Boleto !== columnId
  }

  return (
    <div className="space-y-4">
      {/* Pesquisa + Filtros + Ordenação */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={responsibilityFilter === 'todos' ? 'default' : 'outline'}
            onClick={() => setResponsibilityFilter('todos')}
          >
            Ambos
          </Button>
          <Button
            size="sm"
            variant={responsibilityFilter === 'motorista' ? 'default' : 'outline'}
            onClick={() => setResponsibilityFilter('motorista')}
          >
            Motorista
          </Button>
          <Button
            size="sm"
            variant={responsibilityFilter === 'empresa' ? 'default' : 'outline'}
            onClick={() => setResponsibilityFilter('empresa')}
          >
            Empresa
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar no Kanban por placa, auto, motorista, tag..."
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-[260px]">
          <Select
            options={sortOptions}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as KanbanSortOption)}
          />
        </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        <span className="font-medium text-slate-600 dark:text-neutral-400">Arraste livre:</span>
        {KANBAN_COLUMNS.filter(c => c.id !== 'Vencido').map((col, i, arr) => (
          <span key={col.id} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${col.color}`} />
            <span>{col.label}</span>
            {i < arr.length - 1 && <span className="text-slate-300 dark:text-neutral-600 mx-1">→</span>}
          </span>
        ))}
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto lg:overflow-visible pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 min-h-[60vh]">
        {KANBAN_COLUMNS.map((column) => {
          const columnMultas = sortMultas(multasByStatus[column.id])
          const visibleCount = visibleByStatus[column.id] ?? INITIAL_VISIBLE_PER_COLUMN
          const visibleMultas = columnMultas.slice(0, visibleCount)
          const remainingCount = Math.max(0, columnMultas.length - visibleMultas.length)
          const isOver = dragOverColumn === column.id
          const dropAllowed = isDropAllowed(column.id)
          const isDraggingFromThisColumn = draggingMulta?.Status_Boleto === column.id

          return (
            <div
              key={column.id}
              className={`flex flex-col shrink-0 w-[300px] lg:w-0 lg:flex-1 rounded-2xl transition-all duration-300
                ${isOver && dropAllowed
                  ? `${column.lightBg} ${column.borderColor} border-2 border-dashed shadow-lg scale-[1.01]`
                  : isOver && !dropAllowed
                    ? 'bg-red-50 dark:bg-red-950/15 border-2 border-dashed border-red-200 dark:border-red-900'
                    : 'bg-slate-50/80 dark:bg-neutral-950/50 border-2 border-transparent'
                }`}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={() => handleDragLeave(column.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header — sticky on desktop page scroll */}
              <div className="sticky top-16 z-30 p-3 pb-2 bg-white/95 backdrop-blur-sm border-b border-slate-200 rounded-t-2xl dark:bg-neutral-950/95 dark:border-neutral-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className={`font-bold text-sm ${column.textColor}`}>{column.label}</h3>
                  <span className="ml-auto text-xs font-semibold bg-white rounded-full px-2.5 py-0.5 text-slate-600 shadow-sm border dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700">
                    {columnMultas.length}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {formatValorDisplay(columnTotals[column.id])}
                </p>
              </div>

              {/* Drop zone hint */}
              {draggingMulta && !isDraggingFromThisColumn && (
                <div className={`mx-3 mb-2 p-2 rounded-lg text-center text-[10px] font-medium transition-all duration-200
                  ${dropAllowed 
                    ? `${column.lightBg} ${column.textColor} border border-dashed ${column.borderColor}` 
                    : 'bg-slate-100 dark:bg-neutral-900 text-slate-400 dark:text-neutral-500 border border-dashed border-slate-200 dark:border-neutral-700'}`}
                >
                  {dropAllowed ? 'Solte aqui para mover' : 'Não permitido'}
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 p-3 pt-1 space-y-2.5 min-h-[200px]">
                {columnMultas.length === 0 && !draggingMulta && (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-900 flex items-center justify-center mb-2">
                      <FileText className="h-5 w-5 text-slate-300 dark:text-neutral-500" />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-neutral-500">Nenhuma multa</p>
                  </div>
                )}
                {visibleMultas.map((multa) => (
                  <div
                    key={multa.id}
                    className={`transition-opacity duration-200 ${updatingId === multa.id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <KanbanCard
                      multa={multa}
                      nota={localNotesById[multa.id] ?? (multa.Notas || '')}
                      tags={tagsByMultaId[multa.id] ?? []}
                      columnColors={{
                        gradient: column.gradient,
                        cardBg: column.cardBg,
                        cardBorder: column.cardBorder,
                        iconBg: column.iconBg,
                        iconText: column.iconText,
                        buttonBg: column.buttonBg,
                        buttonHover: column.buttonHover,
                      }}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggingMulta?.id === multa.id}
                      onViewDetails={permissions?.canViewDetails ? onViewDetails : undefined}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      onQuickEditNote={handleQuickEditNote}
                    />
                  </div>
                ))}

                {remainingCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-dashed"
                    onClick={() => handleLoadMore(column.id)}
                  >
                    Carregar mais ({remainingCount})
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {pendingStatusChange && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 dark:bg-neutral-950 dark:border-neutral-700 sm:p-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">Confirmar mudança de status</h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
              Confira os dados abaixo antes de mover a multa.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900/50 p-3 space-y-2">
              <div className="text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate">{pendingStatusChange.multa.Veiculo}</div>
              <div className="text-xs text-slate-600 dark:text-neutral-400 font-mono truncate">{pendingStatusChange.multa.Auto_Infracao}</div>
              <div className="text-xs text-slate-600 dark:text-neutral-400 truncate">{pendingStatusChange.multa.Motorista}</div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{pendingStatusChange.multa.Valor_Boleto || pendingStatusChange.multa.Valor}</div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 dark:border-neutral-700 p-3 bg-white dark:bg-neutral-900 dark:border-neutral-700">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${getColumnById(pendingStatusChange.multa.Status_Boleto)?.color || 'bg-slate-400'}`} />
                  <span className="font-medium text-slate-700 dark:text-neutral-300 truncate">{pendingStatusChange.multa.Status_Boleto}</span>
                </div>
                <span className="text-slate-400">→</span>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${getColumnById(pendingStatusChange.targetStatus)?.color || 'bg-slate-400'}`} />
                  <span className="font-bold text-slate-900 dark:text-neutral-100 truncate">{pendingStatusChange.targetStatus}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancelStatusChange}
                disabled={isConfirmingStatus}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmStatusChange}
                disabled={isConfirmingStatus}
              >
                {isConfirmingStatus ? 'Confirmando...' : 'Confirmar mudança'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
