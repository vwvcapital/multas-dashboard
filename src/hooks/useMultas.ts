import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, type Multa } from '@/lib/supabase'
import { calcularStatusBoleto, calcularStatusIndicacao } from '@/lib/utils'
import type { UserRole } from '@/contexts/AuthContext'

// Função para converter valor string "R$ 260,32" para número
function parseValor(valor: string): number {
  if (!valor) return 0
  return parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
}

// Função para converter data "20/01/2026" para Date
function parseData(data: string): Date | null {
  if (!data) return null
  const [dia, mes, ano] = data.split('/')
  return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
}

// Função para recalcular o status do boleto de cada multa
function recalcularStatusBoleto(multa: Multa): Multa {
  // Não recalcular se já está em status final (Concluído, Descontar, Pago)
  if (['Concluído', 'Descontar', 'Pago'].includes(multa.Status_Boleto)) {
    return multa
  }
  
  const statusCalculado = calcularStatusBoleto({
    pago: false,
    concluido: false,
    linkBoleto: multa.Boleto || '',
    dataVencimento: multa.Expiracao_Boleto || '',
  })
  return { ...multa, Status_Boleto: statusCalculado }
}

// Função para recalcular o status de indicação de cada multa
function recalcularStatusIndicacao(multa: Multa): Multa {
  // Se já está indicado, não recalcular
  if (multa.Status_Indicacao === 'Indicado') {
    return multa
  }

  const statusCalculado = calcularStatusIndicacao({
    indicado: false,
    dataExpiracao: multa.Expiracao_Indicacao || '',
  })
  return { ...multa, Status_Indicacao: statusCalculado || undefined }
}

interface UseMultasOptions {
  userRole?: UserRole
}

export function useMultas(options: UseMultasOptions = {}) {
  const { userRole } = options
  const [allMultas, setAllMultas] = useState<Multa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMultas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('Multas')
        .select('*')

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        setError(supabaseError.message)
        setAllMultas([])
      } else {
        // Recalcula o status de cada multa ao carregar
        const multasRecalculadas = ((data as Multa[]) || []).map(recalcularStatusBoleto).map(recalcularStatusIndicacao)
        setAllMultas(multasRecalculadas)
      }
    } catch (err) {
      console.error('Connection error:', err)
      setError('Erro ao conectar com o banco de dados')
      setAllMultas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMultas()
  }, [fetchMultas])

  // Filtrar multas baseado no role do usuário
  // Financeiro não pode ver multas com Status_Boleto = 'Pendente'
  const multas = useMemo(() => {
    if (userRole === 'financeiro') {
      return allMultas.filter(m => m.Status_Boleto !== 'Pendente')
    }
    return allMultas
  }, [allMultas, userRole])

  // Multas filtradas por categoria
  const multasPendentes = useMemo(() => 
    multas.filter(m => m.Status_Boleto === 'Pendente'), 
    [multas]
  )

  const multasDisponiveis = useMemo(() => 
    multas.filter(m => m.Status_Boleto === 'Disponível'), 
    [multas]
  )

  const multasConcluidas = useMemo(() => 
    multas.filter(m => m.Status_Boleto === 'Concluído'), 
    [multas]
  )

  // Multas concluídas do motorista (para RH)
  const multasConcluidasMotorista = useMemo(() => 
    multas.filter(m => 
      m.Status_Boleto === 'Concluído' && 
      m.Resposabilidade?.toLowerCase() === 'motorista'
    ), 
    [multas]
  )

  // Multas com status Descontar (para RH descontar do motorista)
  const multasPagasMotorista = useMemo(() => 
    multas.filter(m => m.Status_Boleto === 'Descontar'), 
    [multas]
  )

  const multasVencidas = useMemo(() => 
    multas.filter(m => m.Status_Boleto === 'Vencido'), 
    [multas]
  )

  // Multas com indicação pendente (Faltando Indicar)
  const multasFaltandoIndicar = useMemo(() => 
    multas.filter(m => m.Status_Indicacao === 'Faltando Indicar'), 
    [multas]
  )

  // Multas com indicação expirada
  const multasIndicacaoExpirada = useMemo(() => 
    multas.filter(m => m.Status_Indicacao === 'Indicar Expirado'), 
    [multas]
  )

  // Multas já indicadas
  const multasIndicadas = useMemo(() => 
    multas.filter(m => m.Status_Indicacao === 'Indicado'), 
    [multas]
  )

  // Multas próximas do vencimento (7 dias) - inclui Pendente e Disponível
  // Ordenadas por data de vencimento (mais próxima primeiro)
  const multasProximoVencimento = useMemo(() => {
    const hoje = new Date()
    return multas.filter(m => {
      // Apenas multas que ainda precisam ser pagas (Pendente ou Disponível)
      if (m.Status_Boleto !== 'Pendente' && m.Status_Boleto !== 'Disponível') return false
      const dataVencimento = parseData(m.Expiracao_Boleto)
      if (!dataVencimento) return false
      const diffDays = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays >= 0 // Vence em até 7 dias
    }).sort((a, b) => {
      // Ordenar por data de vencimento (mais próxima primeiro)
      const dataA = parseData(a.Expiracao_Boleto)
      const dataB = parseData(b.Expiracao_Boleto)
      if (!dataA || !dataB) return 0
      return dataA.getTime() - dataB.getTime()
    })
  }, [multas])

  // Stats baseadas nos campos reais
  const valorTotal = multas.reduce((acc, m) => acc + parseValor(m.Valor), 0)
  // Valor dos boletos só considera multas "Disponível" (com desconto válido)
  const valorBoletoTotal = multasDisponiveis.reduce((acc, m) => acc + parseValor(m.Valor_Boleto), 0)
  
  // Multas recentes (20 últimas cadastradas, baseado no ID)
  const recentes = Math.min(multas.length, 20)
  
  const stats = {
    total: multas.length,
    recentes,
    pendentes: multasPendentes.length,
    disponiveis: multasDisponiveis.length,
    concluidos: multasConcluidas.length,
    concluidosMotorista: multasConcluidasMotorista.length,
    pagosMotorista: multasPagasMotorista.length,
    vencidos: multasVencidas.length,
    proximoVencimento: multasProximoVencimento.length,
    faltandoIndicar: multasFaltandoIndicar.length,
    indicacaoExpirada: multasIndicacaoExpirada.length,
    indicadas: multasIndicadas.length,
    valorTotal,
    valorBoletoTotal,
    valorPendente: multasPendentes.reduce((acc, m) => acc + parseValor(m.Valor_Boleto), 0),
    valorMultaVencimento: multasProximoVencimento.reduce((acc, m) => acc + parseValor(m.Valor), 0),
    valorBoletoVencimento: multasProximoVencimento.reduce((acc, m) => acc + parseValor(m.Valor_Boleto), 0),
  }

  // Função para marcar multa como paga
  // Se responsabilidade é da Empresa, marca automaticamente como Concluído
  // Se responsabilidade é do Motorista, marca como Descontar (para RH processar)
  const marcarComoPago = useCallback(async (multaId: number, comprovantePagamento?: string) => {
    try {
      // Buscar a multa para verificar responsabilidade
      const multa = multas.find(m => m.id === multaId)
      if (!multa) {
        console.error('Multa não encontrada:', multaId)
        return false
      }

      // Determinar novo status baseado na responsabilidade
      // - Empresa: marca como Concluído direto
      // - Motorista: marca como Descontar (RH precisa descontar)
      // - Outros/vazio: marca como Pago (comportamento padrão)
      let novoStatus = 'Pago'
      const responsabilidade = multa.Resposabilidade?.toLowerCase()?.trim()
      
      console.log('Marcando como pago:', { multaId, responsabilidade, campo: multa.Resposabilidade })
      
      if (responsabilidade === 'empresa') {
        novoStatus = 'Concluído'
      } else if (responsabilidade === 'motorista') {
        novoStatus = 'Descontar'
      }
      
      console.log('Novo status:', novoStatus)

      const updateData: { Status_Boleto: string; Comprovante_Pagamento?: string } = { 
        Status_Boleto: novoStatus 
      }
      
      if (comprovantePagamento) {
        updateData.Comprovante_Pagamento = comprovantePagamento
      }

      const { error: supabaseError, data } = await supabase
        .from('Multas')
        .update(updateData)
        .eq('id', multaId)
        .select()

      console.log('Resultado update:', { error: supabaseError, data })

      if (supabaseError) {
        console.error('Erro ao marcar como pago:', supabaseError)
        return false
      }

      // Recarregar dados
      await fetchMultas()
      return true
    } catch (err) {
      console.error('Erro ao marcar como pago:', err)
      return false
    }
  }, [fetchMultas, multas])

  // Função para desmarcar multa como paga (reverter pagamento)
  const desmarcarPagamento = useCallback(async (multaId: number) => {
    try {
      // Buscar a multa para recalcular o status correto
      const multa = multas.find(m => m.id === multaId)
      if (!multa) return false

      // Recalcular o status baseado nos dados da multa
      const { calcularStatusBoleto } = await import('@/lib/utils')
      const novoStatus = calcularStatusBoleto({
        pago: false,
        concluido: false,
        linkBoleto: multa.Boleto || '',
        dataVencimento: multa.Expiracao_Boleto || '',
      })

      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Boleto: novoStatus })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao desmarcar pagamento:', supabaseError)
        return false
      }

      // Recarregar dados
      await fetchMultas()
      return true
    } catch (err) {
      console.error('Erro ao desmarcar pagamento:', err)
      return false
    }
  }, [fetchMultas, multas])

  // Função para RH marcar multa como concluído (após descontar do motorista)
  const marcarComoConcluido = useCallback(async (multaId: number) => {
    try {
      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Boleto: 'Concluído' })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao marcar como concluído:', supabaseError)
        return false
      }

      // Recarregar dados
      await fetchMultas()
      return true
    } catch (err) {
      console.error('Erro ao marcar como concluído:', err)
      return false
    }
  }, [fetchMultas])

  // Função para RH desfazer conclusão (voltar para Descontar ou Disponível baseado na responsabilidade)
  const desfazerConclusao = useCallback(async (multaId: number) => {
    try {
      // Buscar a multa para verificar responsabilidade
      const multa = multas.find(m => m.id === multaId)
      if (!multa) {
        console.error('Multa não encontrada:', multaId)
        return false
      }

      // Determinar para qual status voltar baseado na responsabilidade
      // - Empresa: volta para Disponível (pois foi de Disponível -> Concluído)
      // - Motorista: volta para Descontar (pois foi de Descontar -> Concluído)
      let novoStatus = 'Descontar'
      const responsabilidade = multa.Resposabilidade?.toLowerCase()?.trim()
      
      if (responsabilidade === 'empresa') {
        // Empresa: recalcular o status baseado nos dados do boleto
        const { calcularStatusBoleto } = await import('@/lib/utils')
        novoStatus = calcularStatusBoleto({
          pago: false,
          concluido: false,
          linkBoleto: multa.Boleto || '',
          dataVencimento: multa.Expiracao_Boleto || '',
        })
      }

      console.log('Desfazendo conclusão:', { multaId, responsabilidade, novoStatus })

      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Boleto: novoStatus })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao desfazer conclusão:', supabaseError)
        return false
      }

      // Recarregar dados
      await fetchMultas()
      return true
    } catch (err) {
      console.error('Erro ao desfazer conclusão:', err)
      return false
    }
  }, [fetchMultas, multas])

  // Função para marcar multa como indicada (real infrator indicado no SENATRAN)
  const indicarMotorista = useCallback(async (multaId: number) => {
    try {
      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Indicacao: 'Indicado' })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao indicar motorista:', supabaseError)
        return false
      }

      await fetchMultas()
      return true
    } catch (err) {
      console.error('Erro ao indicar motorista:', err)
      return false
    }
  }, [fetchMultas])

  // Função para desfazer indicação (voltar para Faltando Indicar ou Indicar Expirado)
  const desfazerIndicacao = useCallback(async (multaId: number) => {
    try {
      const multa = multas.find(m => m.id === multaId)
      if (!multa) return false

      const novoStatus = calcularStatusIndicacao({
        indicado: false,
        dataExpiracao: multa.Expiracao_Indicacao || '',
      })

      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Indicacao: novoStatus })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao desfazer indicação:', supabaseError)
        return false
      }

      await fetchMultas()
      return true
    } catch (err) {
      console.error('Erro ao desfazer indicação:', err)
      return false
    }
  }, [fetchMultas, multas])

  const multasPorMes = multas.reduce((acc, multa) => {
    const data = parseData(multa.Data_Cometimento)
    if (data) {
      const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      acc[mes] = (acc[mes] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const multasPorVeiculo = multas.reduce((acc, multa) => {
    if (multa.Veiculo) {
      acc[multa.Veiculo] = (acc[multa.Veiculo] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const multasPorStatus = multas.reduce((acc, multa) => {
    const status = multa.Status_Boleto || 'Outro'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    multas,
    multasPendentes,
    multasDisponiveis,
    multasConcluidas,
    multasConcluidasMotorista,
    multasPagasMotorista,
    multasVencidas,
    multasProximoVencimento,
    multasFaltandoIndicar,
    multasIndicacaoExpirada,
    multasIndicadas,
    loading,
    error,
    stats,
    multasPorMes,
    multasPorVeiculo,
    multasPorStatus,
    marcarComoPago,
    marcarComoConcluido,
    desfazerConclusao,
    desmarcarPagamento,
    indicarMotorista,
    desfazerIndicacao,
    refetch: fetchMultas
  }
}
