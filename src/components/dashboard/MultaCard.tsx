import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Multa } from '@/lib/supabase'
import type { Permissions } from '@/contexts/AuthContext'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Truck, 
  ExternalLink,
  FileText,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  CheckCircle2,
  Undo2
} from 'lucide-react'

interface MultaCardProps {
  multa: Multa
  onViewDetails?: (multa: Multa) => void
  onEdit?: (multa: Multa) => void
  onDelete?: (multa: Multa) => void
  onMarkAsPaid?: (multa: Multa) => void
  onUnmarkAsPaid?: (multa: Multa) => void
  onMarkAsComplete?: (multa: Multa) => void
  onUndoComplete?: (multa: Multa) => void
  permissions?: Permissions
}

const statusBoletoConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'default' | 'secondary' | 'destructive' | 'purple' }> = {
  'Pendente': { label: 'Pendente', variant: 'warning' },
  'Disponível': { label: 'Disponível', variant: 'default' },
  'Pago': { label: 'Pago', variant: 'success' },
  'Descontar': { label: 'À Descontar', variant: 'purple' },
  'Concluído': { label: 'Concluído', variant: 'secondary' },
  'Vencido': { label: 'Vencido', variant: 'destructive' },
}

export function MultaCard({ multa, onViewDetails, onEdit, onDelete, onMarkAsPaid, onUnmarkAsPaid, onMarkAsComplete, onUndoComplete, permissions }: MultaCardProps) {
  const statusBoleto = statusBoletoConfig[multa.Status_Boleto] || { label: multa.Status_Boleto || '-', variant: 'secondary' as const }
  const showActions = onViewDetails || onEdit || onDelete || onMarkAsPaid || onUnmarkAsPaid || onMarkAsComplete || onUndoComplete
  
  // Permissões com fallback para true (comportamento padrão)
  const canAccessBoleto = permissions?.canAccessBoleto ?? true
  const canAccessConsulta = permissions?.canAccessConsulta ?? true
  const canMarkAsPaid = permissions?.canMarkAsPaid ?? true
  const canMarkAsComplete = permissions?.canMarkAsComplete ?? true
  const canEdit = permissions?.canEdit ?? true
  const canDelete = permissions?.canDelete ?? true

  return (
    <Card className="hover-lift group">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-medium text-muted-foreground truncate">
              {multa.Auto_Infracao}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <Truck className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-bold text-lg text-slate-900 truncate">{multa.Veiculo}</span>
              <Badge variant="outline" className="shrink-0 text-[10px] px-2">{multa.Estado}</Badge>
            </div>
          </div>
          <Badge variant={statusBoleto.variant} className="shrink-0">
            {statusBoleto.label}
          </Badge>
        </div>

        {/* Descrição */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed" title={multa.Descricao}>
          {multa.Descricao}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs" title={multa.Motorista}>{multa.Motorista}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{multa.Data_Cometimento}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{multa.Hora_Cometimento}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Vence: {multa.Expiracao_Boleto}</span>
          </div>
        </div>

        {/* Valores */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Valor Multa</p>
            <p className="font-semibold text-slate-700">{multa.Valor}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Valor Boleto</p>
            <p className="font-bold text-lg text-blue-600">{multa.Valor_Boleto}</p>
          </div>
        </div>

        {/* Links e Ações */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {multa.Boleto && multa.Status_Boleto !== 'Vencido' && canAccessBoleto ? (
              <a 
                href={multa.Boleto} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Boleto
              </a>
            ) : multa.Boleto && multa.Status_Boleto === 'Vencido' ? (
              <span 
                className="flex items-center gap-1.5 text-xs text-slate-400 cursor-not-allowed"
                title="Boleto vencido - link bloqueado"
              >
                <FileText className="h-3.5 w-3.5" />
                Vencido
              </span>
            ) : multa.Boleto && !canAccessBoleto ? (
              <span 
                className="flex items-center gap-1.5 text-xs text-slate-400 cursor-not-allowed"
                title="Sem permissão para acessar boleto"
              >
                <FileText className="h-3.5 w-3.5" />
                Boleto
              </span>
            ) : null}
            {multa.Consulta && canAccessConsulta ? (
              <a 
                href={multa.Consulta} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Consultar
              </a>
            ) : multa.Consulta && !canAccessConsulta ? (
              <span 
                className="flex items-center gap-1.5 text-xs text-slate-400 cursor-not-allowed"
                title="Sem permissão para acessar consulta"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Consultar
              </span>
            ) : null}
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1">
              {onMarkAsPaid && multa.Status_Boleto === 'Disponível' && canMarkAsPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                  onClick={() => onMarkAsPaid(multa)}
                  title="Marcar como Pago"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pagar</span>
                </Button>
              )}
              {onMarkAsComplete && multa.Status_Boleto === 'Descontar' && canMarkAsComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                  onClick={() => onMarkAsComplete(multa)}
                  title="Marcar como Concluído (desconto aplicado)"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Concluir</span>
                </Button>
              )}
              {onUndoComplete && multa.Status_Boleto === 'Concluído' && canMarkAsComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => onUndoComplete(multa)}
                  title="Desfazer Conclusão"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Desfazer</span>
                </Button>
              )}
              {onUnmarkAsPaid && multa.Status_Boleto === 'Descontar' && canMarkAsPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                  onClick={() => onUnmarkAsPaid(multa)}
                  title="Desfazer - Voltar para Disponível"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Desfazer</span>
                </Button>
              )}
              {onViewDetails && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs"
                  onClick={() => onViewDetails(multa)}
                  title="Ver Detalhes"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Detalhes</span>
                </Button>
              )}
              {onEdit && canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit(multa)}
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-500" />
                </Button>
              )}
              {onDelete && canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(multa)}
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface MultasCardsProps {
  multas: Multa[]
  onViewDetails?: (multa: Multa) => void
  onEdit?: (multa: Multa) => void
  onDelete?: (multa: Multa) => void
  onMarkAsPaid?: (multa: Multa) => void
  onUnmarkAsPaid?: (multa: Multa) => void
  onMarkAsComplete?: (multa: Multa) => void
  onUndoComplete?: (multa: Multa) => void
  permissions?: Permissions
}

export function MultasCards({ multas, onViewDetails, onEdit, onDelete, onMarkAsPaid, onUnmarkAsPaid, onMarkAsComplete, onUndoComplete, permissions }: MultasCardsProps) {
  if (multas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-muted-foreground font-medium">Nenhuma multa encontrada</p>
        <p className="text-sm text-slate-400 mt-1">Tente ajustar os filtros de busca</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {multas.map((multa) => (
        <MultaCard 
          key={multa.id} 
          multa={multa} 
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkAsPaid={onMarkAsPaid}
          onUnmarkAsPaid={onUnmarkAsPaid}
          onMarkAsComplete={onMarkAsComplete}
          onUndoComplete={onUndoComplete}
          permissions={permissions}
        />
      ))}
    </div>
  )
}
