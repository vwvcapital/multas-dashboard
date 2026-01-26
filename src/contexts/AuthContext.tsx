import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

// Tipos de usuário e permissões
export type UserRole = 'admin' | 'financeiro' | 'rh'

export interface User {
  id: number
  nome: string
  usuario: string
  role: UserRole
}

export interface Permissions {
  canViewDetails: boolean
  canAccessBoleto: boolean
  canAccessConsulta: boolean
  canMarkAsPaid: boolean
  canMarkAsComplete: boolean
  canEdit: boolean
  canDelete: boolean
  canCreate: boolean
}

// Definição de permissões por role
const rolePermissions: Record<UserRole, Permissions> = {
  admin: {
    canViewDetails: true,
    canAccessBoleto: true,
    canAccessConsulta: true,
    canMarkAsPaid: true,
    canMarkAsComplete: true,
    canEdit: true,
    canDelete: true,
    canCreate: true,
  },
  financeiro: {
    canViewDetails: true,
    canAccessBoleto: true,
    canAccessConsulta: true,
    canMarkAsPaid: true,
    canMarkAsComplete: false,
    canEdit: false,
    canDelete: false,
    canCreate: false,
  },
  rh: {
    canViewDetails: true,
    canAccessBoleto: false,
    canAccessConsulta: false,
    canMarkAsPaid: false,
    canMarkAsComplete: true,
    canEdit: false,
    canDelete: false,
    canCreate: false,
  },
}

interface AuthContextType {
  user: User | null
  permissions: Permissions
  isAuthenticated: boolean
  isLoading: boolean
  login: (usuario: string, senha: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (usuario: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      
      // Buscar usuário no Supabase
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario.toLowerCase().trim())
        .eq('senha', senha)
        .single()

      if (error || !data) {
        return { success: false, error: 'Usuário ou senha incorretos' }
      }

      const loggedUser: User = {
        id: data.id,
        nome: data.nome,
        usuario: data.usuario,
        role: data.role as UserRole,
      }

      setUser(loggedUser)
      localStorage.setItem('user', JSON.stringify(loggedUser))
      
      return { success: true }
    } catch (err) {
      console.error('Erro no login:', err)
      return { success: false, error: 'Erro ao conectar com o servidor' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
  }, [])

  const permissions = user ? rolePermissions[user.role] : rolePermissions.rh
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
