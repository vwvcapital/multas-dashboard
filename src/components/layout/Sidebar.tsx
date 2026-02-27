import { 
  LayoutDashboard, 
  Clock,
  AlertTriangle,
  List,
  FileCheck,
  CheckCircle2,
  XCircle,
  FilePlus2,
  X,
  History,
  UserPlus,
  Columns3,
  PanelLeftClose,
  PanelLeftOpen,
  GitBranch
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/contexts/AuthContext'

export type ViewType = 'dashboard' | 'kanban' | 'grafo' | 'recentes' | 'pendentes' | 'disponiveis' | 'concluidas' | 'vencidas' | 'vencimento' | 'indicacao-vencimento' | 'todas'

interface SidebarProps {
  className?: string
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  userRole?: UserRole
  isOpen?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onOpenLogs?: () => void
  counts?: {
    recentes: number
    pendentes: number
    disponiveis: number
    concluidas: number
    vencidas: number
    vencimento: number
    indicacaoVencimento: number
    todas: number
  }
}

export function Sidebar({ className, currentView, onViewChange, userRole: _userRole, isOpen, onClose, collapsed = false, onToggleCollapsed, onOpenLogs, counts }: SidebarProps) {
  const menuItems: { id: ViewType; icon: typeof LayoutDashboard; label: string; count?: number; color?: string; bgColor?: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { id: 'kanban', icon: Columns3, label: 'Kanban', color: 'text-violet-600', bgColor: 'bg-violet-50' },
    { id: 'grafo', icon: GitBranch, label: 'Conexões', color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { id: 'recentes', icon: FilePlus2, label: 'Recentes', count: counts?.recentes, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'pendentes', icon: Clock, label: 'Pendentes', count: counts?.pendentes, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'disponiveis', icon: FileCheck, label: 'Disponíveis', count: counts?.disponiveis, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'concluidas', icon: CheckCircle2, label: 'Concluídas', count: counts?.concluidas, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'vencidas', icon: XCircle, label: 'Vencidas', count: counts?.vencidas, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'vencimento', icon: AlertTriangle, label: 'Próx. Vencimento', count: counts?.vencimento, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'indicacao-vencimento', icon: UserPlus, label: 'Próx. Exp. Indicação', count: counts?.indicacaoVencimento, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { id: 'todas', icon: List, label: 'Todas as Multas', count: counts?.todas, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  ]

  const handleViewChange = (view: ViewType) => {
    onViewChange(view)
    if (onClose) onClose()
  }

  const sidebarContent = (
    <>
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b dark:border-neutral-800">
        <span className="font-semibold text-slate-900 dark:text-neutral-100">Menu</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
        <div className={cn(
          "hidden lg:flex items-center mb-2",
          collapsed ? "justify-center px-1" : "justify-between px-3 py-2"
        )}>
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu Principal
            </span>
          )}
          {onToggleCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapsed}
              className="h-7 w-7"
              title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {menuItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                isActive ? "bg-white/20" : item.bgColor
              )}>
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : item.color)} />
              </div>
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {!collapsed && item.count !== undefined && item.count > 0 && (
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full transition-colors min-w-[24px] text-center",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300"
                )}>
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer info - fixo na parte inferior */}
      <div className="shrink-0 p-4 border-t bg-slate-50/50 dark:bg-neutral-950/50 dark:border-neutral-800">
        {/* Botão de Logs - para todos os usuários */}
        {onOpenLogs && (
          <button
            onClick={onOpenLogs}
            title={collapsed ? 'Histórico' : undefined}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-100 mb-3 dark:text-neutral-400 dark:hover:bg-neutral-900",
              collapsed ? "justify-center" : "gap-3"
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50">
              <History className="h-4 w-4 text-indigo-600" />
            </div>
            {!collapsed && <span className="flex-1 text-left">Histórico</span>}
          </button>
        )}
        {!collapsed && (
          <div className="text-xs text-center text-muted-foreground">
            <p>Sistema de Gestão de Multas</p>
            <p className="mt-1 font-medium text-slate-500 dark:text-neutral-500">© 2026 Comelli Transportes</p>
          </div>
        )}
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden flex flex-col dark:bg-black",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-white/80 backdrop-blur-sm fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 transition-all duration-300 dark:bg-black/90 dark:border-neutral-800",
        collapsed ? "w-20" : "w-72",
        className
      )}>
        {sidebarContent}
      </aside>
      
      {/* Spacer para compensar a sidebar fixed */}
      <div className={cn("hidden lg:block shrink-0 transition-all duration-300", collapsed ? "w-20" : "w-72")} />
    </>
  )
}
