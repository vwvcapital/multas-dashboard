import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'warning' | 'success' | 'destructive'
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  variant = 'default'
}: StatsCardProps) {
  const variantStyles = {
    default: {
      icon: 'bg-blue-50 text-blue-600',
      gradient: 'from-blue-500/10 via-transparent to-transparent'
    },
    warning: {
      icon: 'bg-amber-50 text-amber-600',
      gradient: 'from-amber-500/10 via-transparent to-transparent'
    },
    success: {
      icon: 'bg-emerald-50 text-emerald-600',
      gradient: 'from-emerald-500/10 via-transparent to-transparent'
    },
    destructive: {
      icon: 'bg-red-50 text-red-600',
      gradient: 'from-red-500/10 via-transparent to-transparent'
    }
  }

  const styles = variantStyles[variant]

  return (
    <Card className="relative overflow-hidden hover-lift">
      {/* Gradient background */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", styles.gradient)} />
      
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 text-slate-900 truncate">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                "text-xs mt-2 flex items-center gap-1 font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                <span className="text-sm">{trend.isPositive ? '↓' : '↑'}</span>
                <span>{Math.abs(trend.value)}% vs mês anterior</span>
              </div>
            )}
          </div>
          <div className={cn("flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0", styles.icon)}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
