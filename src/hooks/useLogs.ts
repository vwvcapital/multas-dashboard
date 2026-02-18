import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ActivityLog {
  id: number
  user_id: string
  user_name: string
  user_role: string
  action: string
  entity_type: string
  entity_id: number | null
  entity_description: string | null
  details: Record<string, unknown> | null
  created_at: string
}

type ActionType = 
  | 'marcar_pago' 
  | 'desmarcar_pago' 
  | 'marcar_concluido' 
  | 'desfazer_conclusao'
  | 'indicar_motorista'
  | 'desfazer_indicacao'
  | 'recusar_indicacao'
  | 'criar_multa'
  | 'editar_multa'
  | 'excluir_multa'
  | 'login'
  | 'logout'

interface LogParams {
  action: ActionType
  entityId?: number
  entityDescription?: string
  details?: Record<string, unknown>
}

interface UseLogsOptions {
  userId?: string
  userName?: string
  userRole?: string
}

interface FetchLogsOptions {
  limit?: number
  filterByRole?: string  // Para filtrar por role específica (admin pode usar)
  filterByUserId?: string // Para filtrar por usuário específico
}

export function useLogs({ userId, userName, userRole }: UseLogsOptions = {}) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<{ user_id: string; user_name: string }[]>([])

  // Buscar logs com filtros baseados no role do usuário
  const fetchLogs = useCallback(async (options: FetchLogsOptions = {}) => {
    const { limit = 50, filterByRole, filterByUserId } = options
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      // Se não é admin, filtra apenas pelos logs da própria role
      if (userRole && userRole !== 'admin') {
        query = query.eq('user_role', userRole)
      } else if (userRole === 'admin') {
        // Admin pode filtrar por role ou usuário específico
        if (filterByRole && filterByRole !== 'todos') {
          query = query.eq('user_role', filterByRole)
        }
        if (filterByUserId && filterByUserId !== 'todos') {
          query = query.eq('user_id', filterByUserId)
        }
      }

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        // Se a tabela não existe, apenas retorna vazio sem erro
        if (supabaseError.code === '42P01') {
          console.warn('Tabela activity_logs não existe. Execute o SQL em supabase_logs.sql')
          setLogs([])
          return
        }
        throw supabaseError
      }

      setLogs(data || [])

      // Se é admin, buscar lista de usuários únicos para o filtro
      if (userRole === 'admin' && data && data.length > 0) {
        const uniqueUsers = Array.from(
          new Map(data.map(log => [log.user_id, { user_id: log.user_id, user_name: log.user_name }])).values()
        )
        setAvailableUsers(uniqueUsers)
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err)
      setError('Erro ao carregar logs')
    } finally {
      setLoading(false)
    }
  }, [userRole])

  // Registrar um log
  const registrarLog = useCallback(async (params: LogParams) => {
    if (!userId || !userName || !userRole) {
      console.warn('Usuário não definido para registrar log')
      return false
    }

    try {
      const { error: supabaseError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          action: params.action,
          entity_type: 'multa',
          entity_id: params.entityId || null,
          entity_description: params.entityDescription || null,
          details: params.details || null,
        })

      if (supabaseError) {
        // Se a tabela não existe, apenas loga sem erro
        if (supabaseError.code === '42P01') {
          console.warn('Tabela activity_logs não existe')
          return false
        }
        throw supabaseError
      }

      return true
    } catch (err) {
      console.error('Erro ao registrar log:', err)
      return false
    }
  }, [userId, userName, userRole])

  return {
    logs,
    loading,
    error,
    fetchLogs,
    registrarLog,
    availableUsers,
    isAdmin: userRole === 'admin',
  }
}

// Função auxiliar para formatar a ação para exibição
export function formatAction(action: string): string {
  const actionLabels: Record<string, string> = {
    marcar_pago: 'Marcou como Pago',
    desmarcar_pago: 'Desmarcou Pagamento',
    marcar_concluido: 'Marcou como Concluído',
    desfazer_conclusao: 'Desfez Conclusão',
    criar_multa: 'Criou Multa',
    editar_multa: 'Editou Multa',
    excluir_multa: 'Excluiu Multa',
    login: 'Fez Login',
    logout: 'Fez Logout',
  }
  return actionLabels[action] || action
}

// Função auxiliar para formatar a data
export function formatLogDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
