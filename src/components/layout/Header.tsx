import { Truck, User, LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'

interface HeaderProps {
  onMenuToggle?: () => void
  isSidebarOpen?: boolean
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    financeiro: 'Financeiro',
    rh: 'RH'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden shrink-0"
            onClick={onMenuToggle}
            aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary shadow-lg shadow-primary/25">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Comelli Transportes
              </h1>
              <p className="text-xs text-muted-foreground">Gestão de Multas</p>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Menu do Usuário */}
          {user && (
            <div className="relative" ref={menuRef}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="gap-2 hover:bg-slate-100/80 rounded-xl px-3"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-md">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-tight">{user.nome}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[user.role] || user.role}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200/50 py-2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                    <p className="text-sm font-semibold text-slate-900">{user.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{roleLabels[user.role] || user.role}</p>
                  </div>
                  <div className="px-2 py-1 md:pt-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
