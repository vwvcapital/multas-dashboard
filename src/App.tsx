import { useState, useMemo } from 'react'
import { useMultas } from '@/hooks/useMultas'
import { useLogs } from '@/hooks/useLogs'
import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/components/auth/LoginPage'
import { Header } from '@/components/layout/Header'
import { Sidebar, type ViewType } from '@/components/layout/Sidebar'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { MultasTable } from '@/components/dashboard/MultasTable'
import { MultasCards } from '@/components/dashboard/MultaCard'
import { MultasChart } from '@/components/dashboard/MultasChart'
import { ResponsibilityChart } from '@/components/dashboard/ResponsibilityChart'
import { DescriptionChart } from '@/components/dashboard/DescriptionChart'
import { NovaMultaForm } from '@/components/dashboard/NovaMultaForm'
import { EditMultaForm } from '@/components/dashboard/EditMultaForm'
import { DeleteMultaDialog } from '@/components/dashboard/DeleteMultaDialog'
import { MultaDetailsModal } from '@/components/dashboard/MultaDetailsModal'
import { LogsModal } from '@/components/dashboard/LogsModal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import type { Multa } from '@/lib/supabase'
import { 
  FileWarning, 
  DollarSign, 
  Search,
  AlertCircle,
  AlertTriangle,
  List,
  LayoutGrid,
  Plus,
  Truck,
  Receipt
} from 'lucide-react'

type DisplayMode = 'list' | 'cards'

// Função para converter valor string "R$ 260,32" para número
function parseValor(valor: string): number {
  if (!valor) return 0
  return parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
}

function App() {
  const { isAuthenticated, isLoading: authLoading, permissions, user } = useAuth()
  
  const {
    multas, 
    multasPendentes, 
    multasDisponiveis,
    multasConcluidas,
    multasConcluidasMotorista,
    multasPagasMotorista,
    multasVencidas,
    multasProximoVencimento,
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
    refetch 
  } = useMultas({ userRole: user?.role })

  // Hook de logs
  const { registrarLog } = useLogs({
    userId: user?.usuario,
    userName: user?.nome,
    userRole: user?.role,
  })
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('cards')
  const [showNovaMultaForm, setShowNovaMultaForm] = useState(false)
  const [editingMulta, setEditingMulta] = useState<Multa | null>(null)
  const [deletingMulta, setDeletingMulta] = useState<Multa | null>(null)
  const [viewingMulta, setViewingMulta] = useState<Multa | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)

  // Funções wrapper para ações com logs
  const handleMarcarComoPago = async (multa: Multa) => {
    const success = await marcarComoPago(multa.id)
    if (success) {
      await registrarLog({
        action: 'marcar_pago',
        entityId: multa.id,
        entityDescription: `${multa.Veiculo} - ${multa.Auto_Infracao}`,
        details: { motorista: multa.Motorista, valor: multa.Valor_Boleto },
      })
    }
  }

  const handleDesmarcarPagamento = async (multa: Multa) => {
    const success = await desmarcarPagamento(multa.id)
    if (success) {
      await registrarLog({
        action: 'desmarcar_pago',
        entityId: multa.id,
        entityDescription: `${multa.Veiculo} - ${multa.Auto_Infracao}`,
      })
    }
  }

  const handleMarcarComoConcluido = async (multa: Multa) => {
    const success = await marcarComoConcluido(multa.id)
    if (success) {
      await registrarLog({
        action: 'marcar_concluido',
        entityId: multa.id,
        entityDescription: `${multa.Veiculo} - ${multa.Auto_Infracao}`,
        details: { motorista: multa.Motorista },
      })
    }
  }

  const handleDesfazerConclusao = async (multa: Multa) => {
    const success = await desfazerConclusao(multa.id)
    if (success) {
      await registrarLog({
        action: 'desfazer_conclusao',
        entityId: multa.id,
        entityDescription: `${multa.Veiculo} - ${multa.Auto_Infracao}`,
      })
    }
  }

  // Handlers para criar/editar/excluir com log
  const handleNovaMultaSuccess = async (novaMulta?: { id?: number; Veiculo?: string; Auto_Infracao?: string }) => {
    await refetch()
    if (novaMulta?.id) {
      await registrarLog({
        action: 'criar_multa',
        entityId: novaMulta.id,
        entityDescription: `${novaMulta.Veiculo || ''} - ${novaMulta.Auto_Infracao || ''}`,
      })
    }
  }

  const handleEditMultaSuccess = async () => {
    await refetch()
    if (editingMulta) {
      await registrarLog({
        action: 'editar_multa',
        entityId: editingMulta.id,
        entityDescription: `${editingMulta.Veiculo} - ${editingMulta.Auto_Infracao}`,
      })
    }
  }

  const handleDeleteMultaSuccess = async () => {
    await refetch()
    if (deletingMulta) {
      await registrarLog({
        action: 'excluir_multa',
        entityId: deletingMulta.id,
        entityDescription: `${deletingMulta.Veiculo} - ${deletingMulta.Auto_Infracao}`,
      })
    }
  }

  // Determinar quais multas mostrar baseado na view atual
  const getMultasForView = () => {
    switch (currentView) {
      case 'recentes':
        // Multas recentemente cadastradas (ordenadas por ID decrescente, limitado a 20)
        return [...multas].sort((a, b) => b.id - a.id).slice(0, 20)
      case 'pendentes':
        return multasPendentes
      case 'disponiveis':
        return multasDisponiveis
      case 'pagas-motorista':
        return multasPagasMotorista
      case 'concluidas':
        // Para RH, mostrar apenas concluídas do motorista
        if (user?.role === 'rh') {
          return multasConcluidasMotorista
        }
        return multasConcluidas
      case 'vencidas':
        return multasVencidas
      case 'vencimento':
        return multasProximoVencimento
      case 'todas':
        // Para RH, mostrar apenas multas a descontar e concluídas do motorista
        if (user?.role === 'rh') {
          return multas.filter(m => 
            m.Status_Boleto === 'Descontar' ||
            (m.Status_Boleto === 'Concluído' && m.Resposabilidade?.toLowerCase() === 'motorista')
          )
        }
        return multas
      default:
        return multas
    }
  }

  const multasToShow = getMultasForView()

  const filteredMultas = multasToShow.filter(multa => {
    const matchesSearch = 
      (multa.Veiculo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (multa.Motorista || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (multa.Descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (multa.Auto_Infracao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (multa.Codigo_Infracao ? String(multa.Codigo_Infracao) : '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || multa.Status_Boleto === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calcular totais das multas filtradas
  const filteredTotals = useMemo(() => {
    const valorMultas = filteredMultas.reduce((acc, m) => acc + parseValor(m.Valor), 0)
    const valorBoletos = filteredMultas.reduce((acc, m) => acc + parseValor(m.Valor_Boleto), 0)
    return { valorMultas, valorBoletos, quantidade: filteredMultas.length }
  }, [filteredMultas])

  const statusOptions = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'Pendente', label: 'Pendentes' },
    { value: 'Disponível', label: 'Disponíveis' },
    { value: 'Descontar', label: 'À Descontar' },
    { value: 'Concluído', label: 'Concluídos' },
    { value: 'Vencido', label: 'Vencidos' },
  ]

  // Formatar valores para exibição
  const formatValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Títulos para cada view
  const viewTitles: Record<ViewType, { title: string; description: string }> = {
    dashboard: { 
      title: 'Dashboard de Multas', 
      description: 'Gerencie e acompanhe as multas da sua frota de caminhões' 
    },
    recentes: { 
      title: 'Multas Recentes', 
      description: 'Últimas multas cadastradas no sistema' 
    },
    pendentes: { 
      title: 'Multas Pendentes', 
      description: 'Multas com boleto pendente de pagamento' 
    },
    disponiveis: { 
      title: 'Multas Disponíveis', 
      description: 'Multas com boleto disponível para pagamento' 
    },
    'pagas-motorista': { 
      title: 'Descontar de Motorista', 
      description: 'Multas pagas aguardando desconto na folha do motorista' 
    },
    concluidas: { 
      title: 'Multas Concluídas', 
      description: 'Multas com processo finalizado' 
    },
    vencidas: { 
      title: 'Multas Vencidas', 
      description: 'Multas com boleto vencido' 
    },
    vencimento: { 
      title: 'Próximo ao Vencimento', 
      description: 'Multas que vencem nos próximos 7 dias' 
    },
    todas: { 
      title: 'Todas as Multas', 
      description: 'Lista completa de todas as multas registradas' 
    },
  }

  // Loading de autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/30 mx-auto">
              <Truck className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não está autenticado, mostrar página de login
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 overflow-x-hidden">
      <Header 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen} 
      />
      
      {/* Spacer para compensar o header fixo */}
      <div className="h-16" />
      
      {/* Modal Nova Multa */}
      {showNovaMultaForm && (
        <NovaMultaForm 
          onClose={() => setShowNovaMultaForm(false)} 
          onSuccess={handleNovaMultaSuccess} 
        />
      )}

      {/* Modal Editar Multa */}
      {editingMulta && (
        <EditMultaForm 
          multa={editingMulta}
          onClose={() => setEditingMulta(null)} 
          onSuccess={handleEditMultaSuccess} 
        />
      )}

      {/* Modal Excluir Multa */}
      {deletingMulta && (
        <DeleteMultaDialog 
          multa={deletingMulta}
          onClose={() => setDeletingMulta(null)} 
          onSuccess={handleDeleteMultaSuccess} 
        />
      )}

      {/* Modal Detalhes Multa */}
      {viewingMulta && (
        <MultaDetailsModal 
          multa={viewingMulta}
          onClose={() => setViewingMulta(null)} 
        />
      )}

      {/* Modal de Logs */}
      <LogsModal 
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        userId={user?.usuario}
        userName={user?.nome}
        userRole={user?.role}
      />
      
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          userRole={user?.role}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenLogs={() => setShowLogsModal(true)}
          counts={{
            recentes: stats.recentes,
            pendentes: stats.pendentes,
            disponiveis: stats.disponiveis,
            pagasMotorista: stats.pagosMotorista,
            concluidas: user?.role === 'rh' ? stats.concluidosMotorista : stats.concluidos,
            vencidas: stats.vencidos,
            vencimento: stats.proximoVencimento,
            todas: user?.role === 'rh' 
              ? stats.pagosMotorista + stats.concluidosMotorista 
              : stats.total
          }}
        />
        
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            {/* Page Header */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {viewTitles[currentView].title}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {viewTitles[currentView].description}
                  </p>
                </div>
                {error && (
                  <Badge variant="destructive" className="flex items-center gap-1.5 px-4 py-2 self-start">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </Badge>
                )}
              </div>
            </div>

            {/* Dashboard View - Show Stats and Charts */}
            {currentView === 'dashboard' && (
              <>
                {/* Stats Cards */}
                {loading ? (
                  <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-5">
                          <Skeleton className="h-4 w-24 mb-3" />
                          <Skeleton className="h-8 w-32" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                      <StatsCard
                        title="Total de Multas"
                        value={stats.total}
                        description={`${stats.pendentes} pendentes`}
                        icon={FileWarning}
                        variant="default"
                      />
                      <StatsCard
                        title="Valor das Multas"
                        value={formatValor(stats.valorTotal)}
                        description="Soma de todas as multas"
                        icon={DollarSign}
                        variant="destructive"
                      />
                      <StatsCard
                        title="Valor dos Boletos"
                        value={formatValor(stats.valorBoletoTotal)}
                        description="Soma de todos os boletos"
                        icon={Receipt}
                        variant="success"
                      />
                      <StatsCard
                        title="Próx. Vencimento"
                        value={stats.proximoVencimento}
                        description="Vencem em 7 dias"
                        icon={AlertTriangle}
                        variant={stats.proximoVencimento > 0 ? "destructive" : "success"}
                      />
                    </div>
                  </>
                )}

                {/* Charts - Responsabilidade e Tipos de Infração */}
                {loading ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-5">
                          <Skeleton className="h-4 w-32 mb-4" />
                          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ResponsibilityChart multas={multas} />
                    <DescriptionChart multas={multas} />
                  </div>
                )}

                {/* Charts - Status e Veículo */}
                {loading ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-5">
                          <Skeleton className="h-4 w-32 mb-4" />
                          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <MultasChart 
                      data={multasPorStatus} 
                      title="Multas por Status"
                      color="#f59e0b"
                    />
                    <MultasChart 
                      data={multasPorVeiculo} 
                      title="Multas por Veículo"
                      color="#3b82f6"
                    />
                  </div>
                )}

                {/* Monthly Chart */}
                {!loading && Object.keys(multasPorMes).length > 0 && (
                  <MultasChart 
                    data={multasPorMes} 
                    title="Multas por Período"
                    color="#22c55e"
                  />
                )}
              </>
            )}

            {/* Card de Resumo - Próximo ao Vencimento */}
            {currentView === 'vencimento' && !loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-orange-100">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Multas a Vencer</p>
                        <p className="text-2xl font-bold text-orange-700">{multasProximoVencimento.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-100">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Valor das Multas</p>
                        <p className="text-2xl font-bold text-blue-700">{formatValor(stats.valorMultaVencimento)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100">
                        <FileWarning className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Valor dos Boletos</p>
                        <p className="text-2xl font-bold text-emerald-700">{formatValor(stats.valorBoletoVencimento)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Card de Resumo - Todas as Multas */}
            {currentView === 'todas' && !loading && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-100">
                        <FileWarning className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Total de Multas</p>
                        <p className="text-2xl font-bold text-slate-700">{filteredTotals.quantidade}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-100">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Valor das Multas</p>
                        <p className="text-2xl font-bold text-blue-700">{formatValor(filteredTotals.valorMultas)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100">
                        <Receipt className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Valor dos Boletos</p>
                        <p className="text-2xl font-bold text-emerald-700">{formatValor(filteredTotals.valorBoletos)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters and Actions - Show for list views */}
            {currentView !== 'dashboard' && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por veículo, motorista, descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  {currentView === 'todas' && (
                    <Select
                      options={statusOptions}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-48"
                    />
                  )}
                  
                  {/* Toggle View Mode */}
                  <div className="flex items-center bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setDisplayMode('list')}
                      className={`p-2.5 transition-all duration-200 ${displayMode === 'list' ? 'bg-primary text-white shadow-inner' : 'hover:bg-slate-50'}`}
                      title="Visualizar em lista"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDisplayMode('cards')}
                      className={`p-2.5 transition-all duration-200 ${displayMode === 'cards' ? 'bg-primary text-white shadow-inner' : 'hover:bg-slate-50'}`}
                      title="Visualizar em cards"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Botão Nova Multa - apenas na aba "Todas" e com permissão */}
                  {currentView === 'todas' && permissions.canCreate && (
                    <Button onClick={() => setShowNovaMultaForm(true)} className="shrink-0">
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Nova Multa</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Multas View - List or Cards */}
            {currentView !== 'dashboard' && (
              loading ? (
                <Card>
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-32 mb-4" />
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : displayMode === 'list' ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[800px] sm:min-w-0 px-4 sm:px-0">
                    <MultasTable 
                      multas={filteredMultas} 
                      title={`${viewTitles[currentView].title} (${filteredMultas.length})`}
                      onViewDetails={permissions.canViewDetails ? setViewingMulta : undefined}
                      onEdit={permissions.canEdit ? setEditingMulta : undefined}
                      onDelete={permissions.canDelete ? setDeletingMulta : undefined}
                      onMarkAsPaid={permissions.canMarkAsPaid ? handleMarcarComoPago : undefined}
                      onUnmarkAsPaid={permissions.canMarkAsPaid ? handleDesmarcarPagamento : undefined}
                      onMarkAsComplete={permissions.canMarkAsComplete ? handleMarcarComoConcluido : undefined}
                      onUndoComplete={permissions.canMarkAsComplete ? handleDesfazerConclusao : undefined}
                      permissions={permissions}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">
                    {viewTitles[currentView].title} 
                    <span className="text-muted-foreground font-normal ml-2">({filteredMultas.length})</span>
                  </h3>
                  <MultasCards 
                    multas={filteredMultas}
                    onViewDetails={permissions.canViewDetails ? setViewingMulta : undefined}
                    onEdit={permissions.canEdit ? setEditingMulta : undefined}
                    onDelete={permissions.canDelete ? setDeletingMulta : undefined}
                    onMarkAsPaid={permissions.canMarkAsPaid ? handleMarcarComoPago : undefined}
                    onUnmarkAsPaid={permissions.canMarkAsPaid ? handleDesmarcarPagamento : undefined}
                    onMarkAsComplete={permissions.canMarkAsComplete ? handleMarcarComoConcluido : undefined}
                    onUndoComplete={permissions.canMarkAsComplete ? handleDesfazerConclusao : undefined}
                    permissions={permissions}
                  />
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
