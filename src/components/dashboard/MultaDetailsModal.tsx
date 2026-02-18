import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Multa } from '@/lib/supabase'
import { 
  X, 
  Truck, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  ExternalLink,
  DollarSign,
  Hash,
  AlertCircle,
  Building,
  Receipt,
  UserPlus
} from 'lucide-react'

interface MultaDetailsModalProps {
  multa: Multa
  onClose: () => void
}

const statusBoletoConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'default' | 'secondary' | 'destructive' | 'purple' }> = {
  'Pendente': { label: 'Pendente', variant: 'warning' },
  'Disponível': { label: 'Disponível', variant: 'default' },
  'Descontar': { label: 'À Descontar', variant: 'purple' },
  'Concluído': { label: 'Concluído', variant: 'success' },
  'Vencido': { label: 'Vencido', variant: 'destructive' },
}

const statusIndicacaoConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'default' | 'secondary' | 'destructive' | 'purple' | 'cyan' | 'blue' }> = {
  'Faltando Indicar': { label: 'Faltando Indicar', variant: 'warning' },
  'Indicado': { label: 'Indicado', variant: 'blue' },
  'Indicar Expirado': { label: 'Indicação Expirada', variant: 'destructive' },
}

export function MultaDetailsModal({ multa, onClose }: MultaDetailsModalProps) {
  const statusBoleto = statusBoletoConfig[multa.Status_Boleto] || { label: multa.Status_Boleto || '-', variant: 'secondary' as const }

  // Handle click on backdrop to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 animate-in zoom-in-95 slide-in-from-bottom-4 my-auto">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              Detalhes da Multa
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2 ml-[52px]">
              Auto de Infração: <span className="font-mono font-medium text-slate-700">{multa.Auto_Infracao}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Section */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={statusBoleto.variant}>{statusBoleto.label}</Badge>
            </div>
            {multa.Status_Indicacao && (() => {
              const statusInd = statusIndicacaoConfig[multa.Status_Indicacao] || { label: multa.Status_Indicacao, variant: 'secondary' as const }
              return (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Indicação:</span>
                  <Badge variant={statusInd.variant}>{statusInd.label}</Badge>
                </div>
              )
            })()}
          </div>

          {/* Veículo e Motorista */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-3">
                <Truck className="h-5 w-5" />
                <span className="font-semibold">Veículo</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{multa.Veiculo || '-'}</p>
              <div className="flex items-center gap-2 mt-3">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">{multa.Estado || '-'}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-3">
                <User className="h-5 w-5" />
                <span className="font-semibold">Motorista</span>
              </div>
              <p className="text-lg font-medium text-slate-900">{multa.Motorista || '-'}</p>
              <div className="flex items-center gap-2 mt-3">
                <Building className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Responsabilidade: {multa.Resposabilidade || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm">
                <Calendar className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Data</p>
                <p className="font-semibold text-slate-800">{multa.Data_Cometimento || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm">
                <Clock className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Hora</p>
                <p className="font-semibold text-slate-800">{multa.Hora_Cometimento || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm">
                <Receipt className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Vencimento</p>
                <p className="font-semibold text-slate-800">{multa.Expiracao_Boleto || '-'}</p>
              </div>
            </div>
          </div>

          {/* Indicação de Real Infrator - Apenas para responsabilidade do Motorista */}
          {multa.Resposabilidade?.toLowerCase() === 'motorista' && multa.Expiracao_Indicacao && (
            <div className={`border rounded-xl p-5 ${
              multa.Status_Indicacao === 'Indicado' ? 'bg-blue-50 border-blue-100' :
              multa.Status_Indicacao === 'Indicar Expirado' ? 'bg-red-50 border-red-100' :
              'bg-amber-50 border-amber-100'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className={`h-5 w-5 ${
                  multa.Status_Indicacao === 'Indicado' ? 'text-blue-500' :
                  multa.Status_Indicacao === 'Indicar Expirado' ? 'text-red-500' :
                  'text-amber-500'
                }`} />
                <span className={`font-semibold ${
                  multa.Status_Indicacao === 'Indicado' ? 'text-blue-700' :
                  multa.Status_Indicacao === 'Indicar Expirado' ? 'text-red-700' :
                  'text-amber-700'
                }`}>Indicação de Real Infrator (SENATRAN)</span>
                {multa.Status_Indicacao && (() => {
                  const statusInd = statusIndicacaoConfig[multa.Status_Indicacao] || { label: multa.Status_Indicacao, variant: 'secondary' as const }
                  return (
                    <Badge variant={statusInd.variant} className="ml-auto">
                      {statusInd.label}
                    </Badge>
                  )
                })()}
              </div>
              <p className={`text-sm ${
                multa.Status_Indicacao === 'Indicado' ? 'text-blue-800' :
                multa.Status_Indicacao === 'Indicar Expirado' ? 'text-red-800' :
                'text-amber-800'
              }`}>
                Prazo para indicação: <span className="font-semibold">{multa.Expiracao_Indicacao}</span>
              </p>
            </div>
          )}

          {/* Descrição da Infração */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-700">Descrição da Infração</span>
              {multa.Codigo_Infracao && (
                <Badge variant="outline" className="ml-auto text-red-600 border-red-200 bg-white">
                  <Hash className="h-3 w-3 mr-1" />
                  Código: {multa.Codigo_Infracao}
                </Badge>
              )}
            </div>
            <p className="text-sm text-red-800">{multa.Descricao || '-'}</p>
          </div>

          {/* Valores */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-amber-700 mb-3">
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Valor da Multa</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{multa.Valor || '-'}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <Receipt className="h-5 w-5" />
                <span className="font-semibold">Valor do Boleto</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{multa.Valor_Boleto || '-'}</p>
            </div>
          </div>

          {/* Notas */}
          {multa.Notas && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-slate-600 mb-2">Notas</p>
              <p className="text-sm text-slate-700">{multa.Notas}</p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {multa.Boleto && multa.Status_Boleto !== 'Vencido' ? (
              <a 
                href={multa.Boleto} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 font-medium"
              >
                <FileText className="h-4 w-4" />
                Ver Boleto
              </a>
            ) : multa.Boleto && multa.Status_Boleto === 'Vencido' ? (
              <span 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed font-medium"
                title="Boleto vencido - link bloqueado"
              >
                <FileText className="h-4 w-4" />
                Boleto Vencido
              </span>
            ) : null}
            {multa.Consulta && (
              <a 
                href={multa.Consulta} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium text-slate-700"
              >
                <ExternalLink className="h-4 w-4" />
                Consultar Infração
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
