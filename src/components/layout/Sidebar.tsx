import { 
  LayoutDashboard, 
  Clock,
  AlertTriangle,
  List,
  FileCheck,
  CheckCircle2,
  XCircle,
  UserCheck,
  FilePlus2,
  X,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/contexts/AuthContext'

export type ViewType = 'dashboard' | 'recentes' | 'pendentes' | 'disponiveis' | 'pagas-motorista' | 'concluidas' | 'vencidas' | 'vencimento' | 'todas'

interface SidebarProps {
  className?: string
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  userRole?: UserRole
  isOpen?: boolean
  onClose?: () => void
  onOpenLogs?: () => void
  counts?: {
    recentes: number
    pendentes: number
    disponiveis: number
    pagasMotorista: number
    concluidas: number
    vencidas: number
    vencimento: number
    todas: number
  }
}

export function Sidebar({ className, currentView, onViewChange, userRole, isOpen, onClose, onOpenLogs, counts }: SidebarProps) {
  // Menu items para Admin (pode ver tudo)
  const adminItems: { id: ViewType; icon: typeof LayoutDashboard; label: string; count?: number; color?: string; bgColor?: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { id: 'recentes', icon: FilePlus2, label: 'Recentes', count: counts?.recentes, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'pendentes', icon: Clock, label: 'Pendentes', count: counts?.pendentes, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'disponiveis', icon: FileCheck, label: 'Disponíveis', count: counts?.disponiveis, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'pagas-motorista', icon: UserCheck, label: 'À Descontar', count: counts?.pagasMotorista, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'concluidas', icon: CheckCircle2, label: 'Concluídas', count: counts?.concluidas, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'vencidas', icon: XCircle, label: 'Vencidas', count: counts?.vencidas, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'vencimento', icon: AlertTriangle, label: 'Próx. Vencimento', count: counts?.vencimento, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'todas', icon: List, label: 'Todas as Multas', count: counts?.todas, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  ]

  // Menu items para Financeiro (não pode ver Pendentes)
  const financeiroItems: { id: ViewType; icon: typeof LayoutDashboard; label: string; count?: number; color?: string; bgColor?: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { id: 'recentes', icon: FilePlus2, label: 'Recentes', count: counts?.recentes, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'disponiveis', icon: FileCheck, label: 'Disponíveis', count: counts?.disponiveis, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'pagas-motorista', icon: UserCheck, label: 'À Descontar', count: counts?.pagasMotorista, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'concluidas', icon: CheckCircle2, label: 'Concluídas', count: counts?.concluidas, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'vencidas', icon: XCircle, label: 'Vencidas', count: counts?.vencidas, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'vencimento', icon: AlertTriangle, label: 'Próx. Vencimento', count: counts?.vencimento, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'todas', icon: List, label: 'Todas as Multas', count: counts?.todas, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  ]

  // Menu items para RH - apenas multas pagas do motorista e concluídas
  const rhItems: { id: ViewType; icon: typeof LayoutDashboard; label: string; count?: number; color?: string; bgColor?: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { id: 'pagas-motorista', icon: UserCheck, label: 'À Descontar', count: counts?.pagasMotorista, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'concluidas', icon: CheckCircle2, label: 'Concluídas', count: counts?.concluidas, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'todas', icon: List, label: 'Todas as Multas', count: counts?.todas, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  ]

  // Selecionar o menu correto baseado no role
  const menuItems = userRole === 'rh' 
    ? rhItems 
    : userRole === 'financeiro' 
      ? financeiroItems 
      : adminItems

  const handleViewChange = (view: ViewType) => {
    onViewChange(view)
    if (onClose) onClose()
  }

  const sidebarContent = (
    <>
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <span className="font-semibold text-slate-900">Menu</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
        <div className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mb-2">
          Menu Principal
        </div>
        {menuItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                isActive ? "bg-white/20" : item.bgColor
              )}>
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : item.color)} />
              </div>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full transition-colors min-w-[24px] text-center",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-200 text-slate-700"
                )}>
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer info - fixo na parte inferior */}
      <div className="shrink-0 p-4 border-t bg-slate-50/50">
        {/* Botão de Logs - para todos os usuários */}
        {onOpenLogs && (
          <button
            onClick={onOpenLogs}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-100 mb-3"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50">
              <History className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="flex-1 text-left">Histórico</span>
          </button>
        )}
        <div className="text-xs text-center text-muted-foreground">
          <p>Sistema de Gestão de Multas</p>
          <p className="mt-1 font-medium text-slate-500">© 2026 Comelli Transportes</p>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in-0"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col w-72 border-r bg-white/80 backdrop-blur-sm fixed top-16 left-0 h-[calc(100vh-4rem)] z-30",
        className
      )}>
        {sidebarContent}
      </aside>
      
      {/* Spacer para compensar a sidebar fixed */}
      <div className="hidden lg:block w-72 shrink-0" />
    </>
  )
}
