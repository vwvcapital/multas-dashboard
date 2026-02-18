import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { calcularStatusBoleto, calcularStatusIndicacao } from '@/lib/utils'
import { X, Plus, Loader2, AlertCircle } from 'lucide-react'

interface NovaMultaFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function NovaMultaForm({ onClose, onSuccess }: NovaMultaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    Auto_Infracao: '',
    Veiculo: '',
    Motorista: '',
    Data_Cometimento: '',
    Hora_Cometimento: '',
    Descricao: '',
    Codigo_Infracao: '',
    Valor: '',
    Valor_Boleto: '',
    Estado: '',
    Boleto: '',
    Consulta: '',
    Expiracao_Boleto: '',
    Resposabilidade: 'Empresa',
    Notas: '',
    Expiracao_Indicacao: '',
  })

  // Calcula o status automaticamente
  const statusBoletoCalculado = calcularStatusBoleto({
    pago: false,
    concluido: false,
    linkBoleto: formData.Boleto,
    dataVencimento: formData.Expiracao_Boleto,
  })

  // Calcula o status de indicação automaticamente
  const statusIndicacaoCalculado = calcularStatusIndicacao({
    indicado: false,
    dataExpiracao: formData.Expiracao_Indicacao,
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
      // Verificar se já existe uma multa com o mesmo Auto_Infracao
      const { data: existingMulta, error: checkError } = await supabase
        .from('Multas')
        .select('Auto_Infracao')
        .eq('Auto_Infracao', formData.Auto_Infracao)
        .maybeSingle()

      if (checkError) {
        throw checkError
      }

      if (existingMulta) {
        setError(`Já existe uma multa cadastrada com o Auto de Infração "${formData.Auto_Infracao}". O Auto de Infração deve ser único.`)
        setLoading(false)
        return
      }

      const isMotorista = formData.Resposabilidade === 'Motorista'

      const { error: supabaseError } = await supabase
        .from('Multas')
        .insert([{
          ...formData,
          Status_Boleto: statusBoletoCalculado,
          Status_Indicacao: isMotorista ? statusIndicacaoCalculado : null,
          Expiracao_Indicacao: isMotorista ? formData.Expiracao_Indicacao : '',
          Codigo_Infracao: formData.Codigo_Infracao ? parseInt(formData.Codigo_Infracao) : null,
        }])

      if (supabaseError) {
        throw supabaseError
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating multa:', err)
      setError('Erro ao cadastrar multa. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const estadosOptions = [
    { value: '', label: 'Selecione o estado' },
    { value: 'GO', label: 'GO' },
    { value: 'PR', label: 'PR' },
    { value: 'SC', label: 'SC' },
    { value: 'SP', label: 'SP' },
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
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            Cadastrar Nova Multa
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
                <label className="text-sm font-semibold text-slate-700">Responsabilidade *</label>
                <Select
                  name="Resposabilidade"
                  value={formData.Resposabilidade}
                  onChange={handleChange}
                  options={responsabilidadeOptions}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Motorista {formData.Resposabilidade === 'Motorista' ? '*' : '(opcional)'}
                </label>
                <Input
                  name="Motorista"
                  value={formData.Motorista}
                  onChange={handleChange}
                  placeholder="Nome do motorista"
                  required={formData.Resposabilidade === 'Motorista'}
                />
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <label className="text-sm font-semibold text-slate-700">Vencimento Boleto</label>
                <Input
                  name="Expiracao_Boleto"
                  value={formData.Expiracao_Boleto}
                  onChange={handleChange}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>

            {/* Indicação de Real Infrator - Apenas para responsabilidade do Motorista */}
            {formData.Resposabilidade === 'Motorista' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Prazo p/ Indicação (SENATRAN)</label>
                  <Input
                    name="Expiracao_Indicacao"
                    value={formData.Expiracao_Indicacao}
                    onChange={handleChange}
                    placeholder="DD/MM/AAAA"
                  />
                  <span className="text-xs text-slate-500">Data limite para indicar o real infrator</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Status Indicação</label>
                  <div className={`flex h-11 w-full items-center rounded-xl border-2 px-4 py-2 text-sm font-semibold ${
                    statusIndicacaoCalculado === 'Indicado' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    statusIndicacaoCalculado === 'Indicar Expirado' ? 'bg-red-50 text-red-600 border-red-200' :
                    statusIndicacaoCalculado === 'Faltando Indicar' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {statusIndicacaoCalculado || 'Sem indicação'}
                  </div>
                  <span className="text-xs text-slate-500">Calculado automaticamente</span>
                </div>
              </div>
            )}

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
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Multa
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
