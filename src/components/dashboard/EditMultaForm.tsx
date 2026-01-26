import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, type Multa } from '@/lib/supabase'
import { calcularStatusBoleto } from '@/lib/utils'
import { X, Save, Loader2, Pencil, AlertCircle } from 'lucide-react'

interface EditMultaFormProps {
  multa: Multa
  onClose: () => void
  onSuccess: () => void
}

export function EditMultaForm({ multa, onClose, onSuccess }: EditMultaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    Auto_Infracao: multa.Auto_Infracao || '',
    Veiculo: multa.Veiculo || '',
    Motorista: multa.Motorista || '',
    Data_Cometimento: multa.Data_Cometimento || '',
    Hora_Cometimento: multa.Hora_Cometimento || '',
    Descricao: multa.Descricao || '',
    Codigo_Infracao: multa.Codigo_Infracao?.toString() || '',
    Valor: multa.Valor || '',
    Valor_Boleto: multa.Valor_Boleto || '',
    Estado: multa.Estado || '',
    Boleto: multa.Boleto || '',
    Consulta: multa.Consulta || '',
    Expiracao_Boleto: multa.Expiracao_Boleto || '',
    Resposabilidade: multa.Resposabilidade || 'Empresa',
    Notas: multa.Notas || '',
  })

  // Calcula o status automaticamente
  const statusBoletoCalculado = calcularStatusBoleto({
    pago: false,
    concluido: false,
    linkBoleto: formData.Boleto,
    dataVencimento: formData.Expiracao_Boleto,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({
          ...formData,
          Status_Boleto: statusBoletoCalculado,
          Codigo_Infracao: formData.Codigo_Infracao ? parseInt(formData.Codigo_Infracao) : null,
        })
        .eq('id', multa.id)

      if (supabaseError) {
        throw supabaseError
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating multa:', err)
      setError('Erro ao atualizar multa. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const estadosOptions = [
    { value: '', label: 'Selecione o estado' },
    { value: 'AC', label: 'AC' }, { value: 'AL', label: 'AL' }, { value: 'AP', label: 'AP' },
    { value: 'AM', label: 'AM' }, { value: 'BA', label: 'BA' }, { value: 'CE', label: 'CE' },
    { value: 'DF', label: 'DF' }, { value: 'ES', label: 'ES' }, { value: 'GO', label: 'GO' },
    { value: 'MA', label: 'MA' }, { value: 'MT', label: 'MT' }, { value: 'MS', label: 'MS' },
    { value: 'MG', label: 'MG' }, { value: 'PA', label: 'PA' }, { value: 'PB', label: 'PB' },
    { value: 'PR', label: 'PR' }, { value: 'PE', label: 'PE' }, { value: 'PI', label: 'PI' },
    { value: 'RJ', label: 'RJ' }, { value: 'RN', label: 'RN' }, { value: 'RS', label: 'RS' },
    { value: 'RO', label: 'RO' }, { value: 'RR', label: 'RR' }, { value: 'SC', label: 'SC' },
    { value: 'SP', label: 'SP' }, { value: 'SE', label: 'SE' }, { value: 'TO', label: 'TO' },
  ]

  const responsabilidadeOptions = [
    { value: 'Empresa', label: 'Empresa' },
    { value: 'Motorista', label: 'Motorista' },
  ]

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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 animate-in zoom-in-95 slide-in-from-bottom-4 my-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50">
              <Pencil className="h-5 w-5 text-amber-600" />
            </div>
            Editar Multa
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Auto de Infração *</label>
                <Input
                  name="Auto_Infracao"
                  value={formData.Auto_Infracao}
                  onChange={handleChange}
                  placeholder="Ex: NMS2604531"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Código da Infração</label>
                <Input
                  name="Codigo_Infracao"
                  value={formData.Codigo_Infracao}
                  onChange={handleChange}
                  placeholder="Ex: 5002"
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Veículo (Placa) *</label>
                <Input
                  name="Veiculo"
                  value={formData.Veiculo}
                  onChange={handleChange}
                  placeholder="Ex: TJM8B99"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Motorista *</label>
                <Input
                  name="Motorista"
                  value={formData.Motorista}
                  onChange={handleChange}
                  placeholder="Nome do motorista"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Data *</label>
                <Input
                  name="Data_Cometimento"
                  value={formData.Data_Cometimento}
                  onChange={handleChange}
                  placeholder="DD/MM/AAAA"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Hora</label>
                <Input
                  name="Hora_Cometimento"
                  value={formData.Hora_Cometimento}
                  onChange={handleChange}
                  placeholder="HH:MM"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Estado *</label>
                <Select
                  name="Estado"
                  value={formData.Estado}
                  onChange={handleChange}
                  options={estadosOptions}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Descrição da Infração *</label>
              <textarea
                name="Descricao"
                value={formData.Descricao}
                onChange={handleChange}
                placeholder="Descrição completa da infração"
                className="flex min-h-[100px] w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Valor da Multa *</label>
                <Input
                  name="Valor"
                  value={formData.Valor}
                  onChange={handleChange}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Valor do Boleto</label>
                <Input
                  name="Valor_Boleto"
                  value={formData.Valor_Boleto}
                  onChange={handleChange}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Status Boleto</label>
                <div className={`flex h-11 w-full items-center rounded-xl border-2 px-4 py-2 text-sm font-semibold ${
                  statusBoletoCalculado === 'Pago' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                  statusBoletoCalculado === 'Vencido' ? 'bg-red-50 text-red-600 border-red-200' :
                  statusBoletoCalculado === 'Disponível' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  {statusBoletoCalculado}
                </div>
                <span className="text-xs text-slate-500">Calculado automaticamente</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Responsabilidade</label>
                <Select
                  name="Resposabilidade"
                  value={formData.Resposabilidade}
                  onChange={handleChange}
                  options={responsabilidadeOptions}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Vencimento Boleto</label>
                <Input
                  name="Expiracao_Boleto"
                  value={formData.Expiracao_Boleto}
                  onChange={handleChange}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Link do Boleto</label>
                <Input
                  name="Boleto"
                  value={formData.Boleto}
                  onChange={handleChange}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Link de Consulta</label>
                <Input
                  name="Consulta"
                  value={formData.Consulta}
                  onChange={handleChange}
                  placeholder="https://..."
                  type="url"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Notas</label>
              <Input
                name="Notas"
                value={formData.Notas}
                onChange={handleChange}
                placeholder="Observações adicionais"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto shadow-lg shadow-blue-500/25">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
