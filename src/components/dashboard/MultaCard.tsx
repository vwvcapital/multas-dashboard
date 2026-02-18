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
  Undo2,
  Receipt,
  UserPlus
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
  onIndicar?: (multa: Multa) => void
  onDesfazerIndicacao?: (multa: Multa) => void
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

const statusIndicacaoConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'default' | 'secondary' | 'destructive' | 'purple' | 'cyan' | 'blue' }> = {
  'Faltando Indicar': { label: 'Faltando Indicar', variant: 'warning' },
  'Indicado': { label: 'Indicado', variant: 'blue' },
  'Indicar Expirado': { label: 'Indicação Expirada', variant: 'destructive' },
}

export function MultaCard({ multa, onViewDetails, onEdit, onDelete, onMarkAsPaid, onUnmarkAsPaid, onMarkAsComplete, onUndoComplete, onIndicar, onDesfazerIndicacao, permissions }: MultaCardProps) {
  const statusBoleto = statusBoletoConfig[multa.Status_Boleto] || { label: multa.Status_Boleto || '-', variant: 'secondary' as const }
  const showActions = onViewDetails || onEdit || onDelete || onMarkAsPaid || onUnmarkAsPaid || onMarkAsComplete || onUndoComplete || onIndicar || onDesfazerIndicacao
  
  // Permissões com fallback para true (comportamento padrão)
  const canAccessBoleto = permissions?.canAccessBoleto ?? true
  const canAccessConsulta = permissions?.canAccessConsulta ?? true
  const canMarkAsPaid = permissions?.canMarkAsPaid ?? true
  const canMarkAsComplete = permissions?.canMarkAsComplete ?? true
  const canEdit = permissions?.canEdit ?? true
  const canDelete = permissions?.canDelete ?? true
  const canViewIndicacao = permissions?.canViewIndicacao ?? true

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
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={statusBoleto.variant}>
              {statusBoleto.label}
            </Badge>
            {canViewIndicacao && multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao && (() => {
              const statusInd = statusIndicacaoConfig[multa.Status_Indicacao] || { label: multa.Status_Indicacao, variant: 'secondary' as const }
              return (
                <Badge variant={statusInd.variant} className="text-[10px]">
                  {statusInd.label}
                </Badge>
              )
            })()}
          </div>
        </div>

        {/* Responsabilidade */}
        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant={multa.Resposabilidade?.toLowerCase() === 'motorista' ? 'purple' : 'default'} 
            className="text-[10px]"
          >
            {multa.Resposabilidade || 'Não definida'}
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
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Links */}
          <div className="flex items-center gap-3 flex-wrap">
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
            {multa.Comprovante_Pagamento && (multa.Status_Boleto === 'Concluído' || multa.Status_Boleto === 'Descontar') ? (
              <a 
                href={multa.Comprovante_Pagamento} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Receipt className="h-3.5 w-3.5" />
                Comprovante
              </a>
            ) : null}
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1.5 flex-wrap">
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
              {onIndicar && multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao === 'Faltando Indicar' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs text-cyan-600 border-cyan-200 hover:bg-cyan-50 hover:border-cyan-300"
                  onClick={() => onIndicar(multa)}
                  title="Indicar Real Infrator"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Indicar</span>
                </Button>
              )}
              {onDesfazerIndicacao && multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao === 'Indicado' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => onDesfazerIndicacao(multa)}
                  title="Desfazer Indicação"
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
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  onClick={() => onEdit(multa)}
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && canDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => onDelete(multa)}
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
  onIndicar?: (multa: Multa) => void
  onDesfazerIndicacao?: (multa: Multa) => void
  permissions?: Permissions
}

export function MultasCards({ multas, onViewDetails, onEdit, onDelete, onMarkAsPaid, onUnmarkAsPaid, onMarkAsComplete, onUndoComplete, onIndicar, onDesfazerIndicacao, permissions }: MultasCardsProps) {
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
          onIndicar={onIndicar}
          onDesfazerIndicacao={onDesfazerIndicacao}
          permissions={permissions}
        />
      ))}
    </div>
  )
}
