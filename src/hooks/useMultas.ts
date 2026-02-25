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
  // Normaliza status legado 'Pago' para 'Concluído'
  if (multa.Status_Boleto === 'Pago') {
    return { ...multa, Status_Boleto: 'Concluído' }
  }

  // Respeita status já salvo no banco (inclusive alterações manuais/Kanban)
  if (multa.Status_Boleto === 'Pendente' || multa.Status_Boleto === 'Disponível' || multa.Status_Boleto === 'Vencido' || multa.Status_Boleto === 'Concluído') {
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
  // Se já está indicado ou recusado, não recalcular
  if (multa.Status_Indicacao === 'Indicado' || multa.Status_Indicacao === 'Recusado') {
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
  const [tagsByMultaId, setTagsByMultaId] = useState<Record<number, string[]>>({})
  const [editedAtByMultaId, setEditedAtByMultaId] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('multa_tags')
        .select('multa_id, tag, created_at')
        .order('created_at', { ascending: true })

      if (supabaseError) {
        console.error('Erro ao carregar tags:', supabaseError)
        return
      }

      const grouped = ((data as { multa_id: number; tag: string }[]) || []).reduce((acc, row) => {
        if (!acc[row.multa_id]) {
          acc[row.multa_id] = []
        }
        acc[row.multa_id].push(row.tag)
        return acc
      }, {} as Record<number, string[]>)

      setTagsByMultaId(grouped)
    } catch (err) {
      console.error('Erro ao carregar tags:', err)
    }
  }, [])

  const fetchEditedAt = useCallback(async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('activity_logs')
        .select('entity_id, action, created_at')
        .eq('entity_type', 'multa')
        .in('action', ['editar_multa', 'alterar_status_kanban', 'alterar_status_manual', 'add_tag', 'remove_tag'])
        .order('created_at', { ascending: false })
        .limit(5000)

      if (supabaseError) {
        if (supabaseError.code !== '42P01') {
          console.error('Erro ao carregar histórico de edição:', supabaseError)
        }
        return
      }

      const grouped = ((data as { entity_id: number | null; created_at: string }[]) || []).reduce((acc, row) => {
        if (!row.entity_id || acc[row.entity_id]) return acc
        const timestamp = new Date(row.created_at).getTime()
        if (!Number.isNaN(timestamp)) {
          acc[row.entity_id] = timestamp
        }
        return acc
      }, {} as Record<number, number>)

      setEditedAtByMultaId(grouped)
    } catch (err) {
      console.error('Erro ao carregar histórico de edição:', err)
    }
  }, [])

  const fetchMultas = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false
    try {
      if (!isSilent) {
        setLoading(true)
      }
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('Multas')
        .select('*')
        .order('id', { ascending: false })

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
      if (!isSilent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchMultas()
  }, [fetchMultas])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    fetchEditedAt()
  }, [fetchEditedAt])

  const multas = useMemo(() => {
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

  // Multas concluídas do motorista
  const multasConcluidasMotorista = useMemo(() => 
    multas.filter(m => 
      m.Status_Boleto === 'Concluído' && 
      m.Resposabilidade?.toLowerCase() === 'motorista'
    ), 
    [multas]
  )

  // Multas com status Pago de responsabilidade do motorista
  const multasPagasMotorista = useMemo(() => 
    multas.filter(m => m.Status_Boleto === 'Pago' && m.Resposabilidade?.toLowerCase() === 'motorista'), 
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

  // Multas com indicação recusada pelo motorista
  const multasRecusadas = useMemo(() => 
    multas.filter(m => m.Status_Indicacao === 'Recusado'), 
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

  // Multas com indicação próxima de expirar (Faltando Indicar, ordenadas por data de expiração)
  const multasIndicacaoProximoVencimento = useMemo(() => {
    return multas.filter(m => {
      return m.Status_Indicacao === 'Faltando Indicar' && m.Expiracao_Indicacao
    }).sort((a, b) => {
      const dataA = parseData(a.Expiracao_Indicacao || '')
      const dataB = parseData(b.Expiracao_Indicacao || '')
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
    recusadas: multasRecusadas.length,
    indicacaoProximoVencimento: multasIndicacaoProximoVencimento.length,
    valorTotal,
    valorBoletoTotal,
    valorPendente: multasPendentes.reduce((acc, m) => acc + parseValor(m.Valor_Boleto), 0),
    valorMultaVencimento: multasProximoVencimento.reduce((acc, m) => acc + parseValor(m.Valor), 0),
    valorBoletoVencimento: multasProximoVencimento.reduce((acc, m) => acc + parseValor(m.Valor_Boleto), 0),
  }

  // Função para marcar multa como paga
  // Com fluxo de admin único, empresa e motorista são concluídos diretamente
  const marcarComoPago = useCallback(async (multaId: number, comprovantePagamento?: string) => {
    try {
      // Buscar a multa para verificar responsabilidade
      const multa = multas.find(m => m.id === multaId)
      if (!multa) {
        console.error('Multa não encontrada:', multaId)
        return false
      }

      // Status Pago foi descontinuado: sempre conclui
      let novoStatus = 'Concluído'
      const responsabilidade = multa.Resposabilidade?.toLowerCase()?.trim()
      
      console.log('Marcando como pago:', { multaId, responsabilidade, campo: multa.Resposabilidade })
      
      if (responsabilidade === 'empresa' || responsabilidade === 'motorista') {
        novoStatus = 'Concluído'
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
      await fetchMultas({ silent: true })
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
      await fetchMultas({ silent: true })
      return true
    } catch (err) {
      console.error('Erro ao desmarcar pagamento:', err)
      return false
    }
  }, [fetchMultas, multas])

  // Função para marcar multa como concluído
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
      await fetchMultas({ silent: true })
      return true
    } catch (err) {
      console.error('Erro ao marcar como concluído:', err)
      return false
    }
  }, [fetchMultas])

  // Função para desfazer conclusão (voltar ao status calculado)
  const desfazerConclusao = useCallback(async (multaId: number) => {
    try {
      // Buscar a multa para verificar responsabilidade
      const multa = multas.find(m => m.id === multaId)
      if (!multa) {
        console.error('Multa não encontrada:', multaId)
        return false
      }

      const { calcularStatusBoleto } = await import('@/lib/utils')
      const novoStatus = calcularStatusBoleto({
        pago: false,
        concluido: false,
        linkBoleto: multa.Boleto || '',
        dataVencimento: multa.Expiracao_Boleto || '',
      })

      console.log('Desfazendo conclusão:', { multaId, novoStatus })

      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Boleto: novoStatus })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao desfazer conclusão:', supabaseError)
        return false
      }

      // Recarregar dados
      await fetchMultas({ silent: true })
      return true
    } catch (err) {
      console.error('Erro ao desfazer conclusão:', err)
      return false
    }
  }, [fetchMultas, multas])

  // Função genérica para atualizar status do boleto (usada pelo Kanban)
  const updateStatusBoleto = useCallback(async (multaId: number, novoStatus: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Boleto: novoStatus })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao atualizar status:', supabaseError)
        return false
      }

      await fetchMultas({ silent: true })
      setEditedAtByMultaId((prev) => ({ ...prev, [multaId]: Date.now() }))
      return true
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      return false
    }
  }, [fetchMultas])

  // Atualização rápida da nota da multa (usado no Kanban)
  const updateNotaMulta = useCallback(async (multaId: number, nota: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Notas: nota })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao atualizar nota:', supabaseError)
        return false
      }

      // Atualiza apenas a multa editada, preservando ordem atual da lista
      setAllMultas((prev) => prev.map((multa) =>
        multa.id === multaId ? { ...multa, Notas: nota } : multa
      ))
      setEditedAtByMultaId((prev) => ({ ...prev, [multaId]: Date.now() }))
      return true
    } catch (err) {
      console.error('Erro ao atualizar nota:', err)
      return false
    }
  }, [])

  const addTag = useCallback(async (multaId: number, tag: string) => {
    const normalizedTag = tag.trim()
    if (!normalizedTag) return false

    try {
      const current = tagsByMultaId[multaId] || []
      if (current.some((item) => item.toLowerCase() === normalizedTag.toLowerCase())) {
        return true
      }

      const { error: supabaseError } = await supabase
        .from('multa_tags')
        .insert({ multa_id: multaId, tag: normalizedTag })

      if (supabaseError) {
        console.error('Erro ao adicionar tag:', supabaseError)
        return false
      }

      setTagsByMultaId((prev) => ({
        ...prev,
        [multaId]: [...(prev[multaId] || []), normalizedTag],
      }))
      setEditedAtByMultaId((prev) => ({ ...prev, [multaId]: Date.now() }))
      return true
    } catch (err) {
      console.error('Erro ao adicionar tag:', err)
      return false
    }
  }, [tagsByMultaId])

  const removeTag = useCallback(async (multaId: number, tag: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('multa_tags')
        .delete()
        .eq('multa_id', multaId)
        .eq('tag', tag)

      if (supabaseError) {
        console.error('Erro ao remover tag:', supabaseError)
        return false
      }

      setTagsByMultaId((prev) => ({
        ...prev,
        [multaId]: (prev[multaId] || []).filter((item) => item !== tag),
      }))
      setEditedAtByMultaId((prev) => ({ ...prev, [multaId]: Date.now() }))
      return true
    } catch (err) {
      console.error('Erro ao remover tag:', err)
      return false
    }
  }, [])

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

      await fetchMultas({ silent: true })
      return true
    } catch (err) {
      console.error('Erro ao indicar motorista:', err)
      return false
    }
  }, [fetchMultas])

  // Função para marcar indicação como recusada pelo motorista
  const recusarIndicacao = useCallback(async (multaId: number) => {
    try {
      const { error: supabaseError } = await supabase
        .from('Multas')
        .update({ Status_Indicacao: 'Recusado' })
        .eq('id', multaId)

      if (supabaseError) {
        console.error('Erro ao recusar indicação:', supabaseError)
        return false
      }

      await fetchMultas({ silent: true })
      return true
    } catch (err) {
      console.error('Erro ao recusar indicação:', err)
      return false
    }
  }, [fetchMultas])

  // Função para desfazer indicação
  // Se Recusado → volta para Indicado
  // Se Indicado → recalcula (Faltando Indicar ou Indicar Expirado)
  const desfazerIndicacao = useCallback(async (multaId: number) => {
    try {
      const multa = multas.find(m => m.id === multaId)
      if (!multa) return false

      // Se está Recusado, volta para Indicado
      // Se está Indicado, recalcula baseado na data de expiração
      const novoStatus = multa.Status_Indicacao === 'Recusado' 
        ? 'Indicado'
        : calcularStatusIndicacao({
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

      await fetchMultas({ silent: true })
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
    multasRecusadas,
    multasIndicacaoProximoVencimento,
    loading,
    error,
    tagsByMultaId,
    editedAtByMultaId,
    stats,
    multasPorMes,
    multasPorVeiculo,
    multasPorStatus,
    marcarComoPago,
    marcarComoConcluido,
    desfazerConclusao,
    desmarcarPagamento,
    updateStatusBoleto,
    updateNotaMulta,
    addTag,
    removeTag,
    indicarMotorista,
    recusarIndicacao,
    desfazerIndicacao,
    refetch: fetchMultas
  }
}
