import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Multa } from '@/lib/supabase'
import type { Permissions } from '@/contexts/AuthContext'
import { FileText, ExternalLink, Eye, Pencil, Trash2, CheckCircle, CheckCircle2, Undo2, ClipboardList, Receipt, UserPlus, UserX } from 'lucide-react'

interface MultasTableProps {
  multas: Multa[]
  title?: string
  onViewDetails?: (multa: Multa) => void
  onEdit?: (multa: Multa) => void
  onDelete?: (multa: Multa) => void
  onMarkAsPaid?: (multa: Multa) => void
  onUnmarkAsPaid?: (multa: Multa) => void
  onMarkAsComplete?: (multa: Multa) => void
  onUndoComplete?: (multa: Multa) => void
  onIndicar?: (multa: Multa) => void
  onDesfazerIndicacao?: (multa: Multa) => void
  onRecusarIndicacao?: (multa: Multa) => void
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
  'Recusado': { label: 'Recusado', variant: 'destructive' },
}

export function MultasTable({ multas, title = "Multas Recentes", onViewDetails, onEdit, onDelete, onMarkAsPaid, onUnmarkAsPaid, onMarkAsComplete, onUndoComplete, onIndicar, onDesfazerIndicacao, onRecusarIndicacao, permissions }: MultasTableProps) {
  const showActions = onViewDetails || onEdit || onDelete || onMarkAsPaid || onUnmarkAsPaid || onMarkAsComplete || onUndoComplete || onIndicar || onDesfazerIndicacao
  const canAccessBoleto = permissions?.canAccessBoleto ?? true
  const canAccessConsulta = permissions?.canAccessConsulta ?? true
  const canMarkAsComplete = permissions?.canMarkAsComplete ?? true
  const canViewIndicacao = permissions?.canViewIndicacao ?? true
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="font-semibold text-slate-700">Auto de Infração</TableHead>
                <TableHead className="font-semibold text-slate-700">Veículo</TableHead>
                <TableHead className="font-semibold text-slate-700">Motorista</TableHead>
                <TableHead className="font-semibold text-slate-700">Data/Hora</TableHead>
                <TableHead className="font-semibold text-slate-700">Descrição</TableHead>
                <TableHead className="font-semibold text-slate-700">UF</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Valor</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Valor Boleto</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">Status</TableHead>
                {canViewIndicacao && <TableHead className="text-center font-semibold text-slate-700">Indicação</TableHead>}
                <TableHead className="text-center font-semibold text-slate-700">Links</TableHead>
                {showActions && <TableHead className="text-center font-semibold text-slate-700">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
            {multas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(showActions ? 12 : 11) - (canViewIndicacao ? 0 : 1)} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground font-medium">Nenhuma multa encontrada</p>
                    <p className="text-sm text-slate-400 mt-1">Tente ajustar os filtros de busca</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              multas.map((multa) => {
                const statusBoleto = statusBoletoConfig[multa.Status_Boleto] || { label: multa.Status_Boleto || '-', variant: 'secondary' as const }
                
                return (
                  <TableRow key={multa.id} className="hover:bg-blue-50/50 transition-colors group">
                    <TableCell className="font-mono text-xs font-medium text-slate-600">
                      {multa.Auto_Infracao || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-blue-600">
                        {multa.Veiculo || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-slate-600" title={multa.Motorista}>
                      {multa.Motorista || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-slate-700">{multa.Data_Cometimento || '-'}</div>
                        <div className="text-muted-foreground text-xs">{multa.Hora_Cometimento}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-600 text-sm" title={multa.Descricao}>
                      {multa.Descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{multa.Estado || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700">
                      {multa.Valor || '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      {multa.Valor_Boleto || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusBoleto.variant}>
                        {statusBoleto.label}
                      </Badge>
                    </TableCell>
                    {canViewIndicacao && (
                      <TableCell className="text-center">
                        {multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao ? (() => {
                          const statusInd = statusIndicacaoConfig[multa.Status_Indicacao] || { label: multa.Status_Indicacao, variant: 'secondary' as const }
                          return (
                            <Badge variant={statusInd.variant} className="text-[10px]">
                              {statusInd.label}
                            </Badge>
                          )
                        })() : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2 justify-center">
                        {canAccessBoleto && multa.Boleto && multa.Status_Boleto !== 'Vencido' ? (
                          <a 
                            href={multa.Boleto} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Ver Boleto"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : multa.Boleto && multa.Status_Boleto === 'Vencido' ? (
                          <span 
                            className="text-slate-300 cursor-not-allowed"
                            title="Boleto vencido - link bloqueado"
                          >
                            <FileText className="h-4 w-4" />
                          </span>
                        ) : multa.Boleto && !canAccessBoleto ? (
                          <span 
                            className="text-slate-300 cursor-not-allowed"
                            title="Sem permissão para acessar boleto"
                          >
                            <FileText className="h-4 w-4" />
                          </span>
                        ) : null}
                        {canAccessConsulta && multa.Consulta ? (
                          <a 
                            href={multa.Consulta} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-slate-700 transition-colors"
                            title="Consultar Infração"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : multa.Consulta && !canAccessConsulta ? (
                          <span 
                            className="text-slate-300 cursor-not-allowed"
                            title="Sem permissão para consultar"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </span>
                        ) : null}
                        {multa.Comprovante_Pagamento && (multa.Status_Boleto === 'Concluído' || multa.Status_Boleto === 'Descontar') ? (
                          <a 
                            href={multa.Comprovante_Pagamento} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 transition-colors"
                            title="Ver Comprovante de Pagamento"
                          >
                            <Receipt className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          {onMarkAsPaid && multa.Status_Boleto === 'Disponível' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                              onClick={() => onMarkAsPaid(multa)}
                              title="Marcar como Pago"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="hidden xl:inline">Pagar</span>
                            </Button>
                          )}
                          {onMarkAsComplete && multa.Status_Boleto === 'Descontar' && canMarkAsComplete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                              onClick={() => onMarkAsComplete(multa)}
                              title="Marcar como Concluído (desconto aplicado)"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="hidden xl:inline">Concluir</span>
                            </Button>
                          )}
                          {onUndoComplete && multa.Status_Boleto === 'Concluído' && canMarkAsComplete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                              onClick={() => onUndoComplete(multa)}
                              title="Desfazer Conclusão"
                            >
                              <Undo2 className="h-4 w-4" />
                              <span className="hidden xl:inline">Desfazer</span>
                            </Button>
                          )}
                          {onUnmarkAsPaid && multa.Status_Boleto === 'Descontar' && permissions?.canMarkAsPaid && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                              onClick={() => onUnmarkAsPaid(multa)}
                              title="Desfazer - Voltar para Disponível"
                            >
                              <Undo2 className="h-4 w-4" />
                              <span className="hidden xl:inline">Desfazer</span>
                            </Button>
                          )}
                          {onIndicar && multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao === 'Faltando Indicar' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-cyan-600 border-cyan-200 hover:bg-cyan-50 hover:border-cyan-300"
                              onClick={() => onIndicar(multa)}
                              title="Indicar Real Infrator"
                            >
                              <UserPlus className="h-4 w-4" />
                              <span className="hidden xl:inline">Indicar</span>
                            </Button>
                          )}
                          {onDesfazerIndicacao && multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao === 'Indicado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                              onClick={() => onDesfazerIndicacao(multa)}
                              title="Desfazer Indicação"
                            >
                              <Undo2 className="h-4 w-4" />
                              <span className="hidden xl:inline">Desfazer</span>
                            </Button>
                          )}
                          {onRecusarIndicacao && multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao === 'Faltando Indicar' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                              onClick={() => onRecusarIndicacao(multa)}
                              title="Motorista Recusou Indicação"
                            >
                              <UserX className="h-4 w-4" />
                              <span className="hidden xl:inline">Recusar</span>
                            </Button>
                          )}
                          {onDesfazerIndicacao && multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Status_Indicacao === 'Recusado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                              onClick={() => onDesfazerIndicacao(multa)}
                              title="Desfazer Recusa"
                            >
                              <Undo2 className="h-4 w-4" />
                              <span className="hidden xl:inline">Desfazer</span>
                            </Button>
                          )}
                          {onViewDetails && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 px-3 gap-1.5"
                              onClick={() => onViewDetails(multa)}
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden lg:inline">Detalhes</span>
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => onEdit(multa)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4 text-slate-500" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => onDelete(multa)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  )
}
