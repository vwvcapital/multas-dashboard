import { useEffect, useState } from 'react'
import { X, History, User, Clock, FileText, RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'
import { useLogs, formatAction, formatLogDate } from '@/hooks/useLogs'
import { cn } from '@/lib/utils'

interface LogsModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
  userName?: string
  userRole?: string
}

export function LogsModal({ isOpen, onClose, userId, userName, userRole }: LogsModalProps) {
  const { logs, loading, fetchLogs, availableUsers, isAdmin } = useLogs({ userId, userName, userRole })
  const [filterRole, setFilterRole] = useState('todos')
  const [filterUser, setFilterUser] = useState('todos')

  useEffect(() => {
    if (isOpen) {
      fetchLogs({ filterByRole: filterRole, filterByUserId: filterUser })
    }
  }, [isOpen, fetchLogs, filterRole, filterUser])

  const handleRefresh = () => {
    fetchLogs({ filterByRole: filterRole, filterByUserId: filterUser })
  }

  if (!isOpen) return null

  const getActionColor = (action: string) => {
    switch (action) {
      case 'marcar_pago':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'desmarcar_pago':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'marcar_concluido':
        return 'bg-teal-100 text-teal-700 border-teal-200'
      case 'desfazer_conclusao':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'criar_multa':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'editar_multa':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'excluir_multa':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'login':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'logout':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      financeiro: 'Financeiro',
      rh: 'RH',
    }
    return labels[role] || role
  }

  const roleOptions = [
    { value: 'todos', label: 'Todas as Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'rh', label: 'RH' },
  ]

  const userOptions = [
    { value: 'todos', label: 'Todos os Usuários' },
    ...availableUsers.map(u => ({ value: u.user_id, label: u.user_name }))
  ]

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100">
              <History className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Histórico de Atividades</h2>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? 'Registro de ações de todos os usuários' : `Suas ações como ${getRoleLabel(userRole || '')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              className="h-8 w-8"
              title="Atualizar"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filters - only for admin */}
        {isAdmin && (
          <div className="p-4 border-b bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-700">Filtros</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                options={roleOptions}
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="flex-1"
              />
              <Select
                options={userOptions}
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">Nenhum registro encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? 'Nenhuma atividade registrada ainda' : 'Você ainda não realizou nenhuma ação'}
              </p>
              <p className="text-xs text-muted-foreground mt-4 max-w-sm">
                💡 Certifique-se de que a tabela <code className="bg-slate-100 px-1 rounded">activity_logs</code> foi criada no Supabase
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-xs font-medium", getActionColor(log.action))}>
                            {formatAction(log.action)}
                          </Badge>
                          {log.entity_id && (
                            <span className="text-xs text-muted-foreground">
                              Multa #{log.entity_id}
                            </span>
                          )}
                        </div>
                        
                        {log.entity_description && (
                          <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                            {log.entity_description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>{log.user_name}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                              {getRoleLabel(log.user_role)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatLogDate(log.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl shrink-0">
          <p className="text-xs text-center text-muted-foreground">
            Mostrando {logs.length} registro{logs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  )
}
