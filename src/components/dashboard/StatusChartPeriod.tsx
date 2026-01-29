import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import type { Multa } from '@/lib/supabase'

type PeriodType = 'all' | 'week' | 'month' | 'quarter' | 'semester' | 'year'
type ChartType = 'pie' | 'bar'

interface StatusChartPeriodProps {
  multas: Multa[]
}

const COLORS: Record<string, string> = {
  'Pendente': '#f59e0b',
  'Disponível': '#3b82f6',
  'Concluído': '#22c55e',
  'Descontar': '#8b5cf6',
  'Vencido': '#ef4444',
  'Pago': '#10b981',
  'Outro': '#94a3b8'
}

const periodOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'week', label: 'Última Semana' },
  { value: 'month', label: 'Último Mês' },
  { value: 'quarter', label: 'Último Trimestre' },
  { value: 'semester', label: 'Último Semestre' },
  { value: 'year', label: 'Último Ano' },
]

// Função para converter data "20/01/2026" para Date
function parseData(data: string): Date | null {
  if (!data) return null
  const parts = data.split('/')
  if (parts.length !== 3) return null
  const [dia, mes, ano] = parts
  return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
}

function getStartDate(period: PeriodType): Date | null {
  if (period === 'all') return null
  const now = new Date()
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case 'quarter':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case 'semester':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    default:
      return null
  }
}

export function StatusChartPeriod({ multas }: StatusChartPeriodProps) {
  const [period, setPeriod] = useState<PeriodType>('all')
  const [chartType, setChartType] = useState<ChartType>('pie')

  const filteredData = useMemo(() => {
    const startDate = getStartDate(period)
    
    const filtered = startDate 
      ? multas.filter(multa => {
          const multaDate = parseData(multa.Data_Cometimento)
          if (!multaDate) return false
          return multaDate >= startDate
        })
      : multas

    // Agrupar por status
    const statusCount = filtered.reduce((acc, multa) => {
      const status = multa.Status_Boleto || 'Outro'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = filtered.length

    const chartData = Object.entries(statusCount)
      .map(([status, count]) => ({
        name: status,
        value: count,
        color: COLORS[status] || COLORS['Outro'],
        percent: total > 0 ? (count / total) : 0
      }))
      .sort((a, b) => b.value - a.value)

    return { chartData, total }
  }, [multas, period])

  const { chartData, total } = filteredData

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
              <PieChartIcon className="h-4 w-4 text-amber-600" />
            </div>
            Multas por Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              options={periodOptions}
              className="text-sm h-9 w-36"
            />
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <Button
                variant={chartType === 'pie' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('pie')}
                className="rounded-none h-9 px-3"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="rounded-none h-9 px-3"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {total === 0 ? (
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                <PieChartIcon className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-muted-foreground font-medium">Sem dados para exibir</p>
              <p className="text-sm text-muted-foreground mt-1">Nenhuma multa no período selecionado</p>
            </div>
          </div>
        ) : chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#64748b' }}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px'
                }}
                formatter={(value) => [`${value} multa(s)`, '']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: '#0f172a' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px'
                }}
                formatter={(value) => [`${value} multa(s)`, '']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {/* Resumo */}
        {total > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {chartData.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600">
                    {item.name}: <strong>{item.value}</strong> ({(item.percent * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
