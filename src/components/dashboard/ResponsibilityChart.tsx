import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PieChart as PieChartIcon, BarChart3, Users } from 'lucide-react'
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

type PeriodType = 'week' | 'month' | 'quarter' | 'semester' | 'year'
type ChartType = 'pie' | 'bar'

interface ResponsibilityChartProps {
  multas: Multa[]
}

const COLORS = {
  motorista: '#f59e0b',
  empresa: '#3b82f6'
}

const periodOptions = [
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

function getStartDate(period: PeriodType): Date {
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
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  }
}

export function ResponsibilityChart({ multas }: ResponsibilityChartProps) {
  const [period, setPeriod] = useState<PeriodType>('month')
  const [chartType, setChartType] = useState<ChartType>('pie')

  const filteredData = useMemo(() => {
    const startDate = getStartDate(period)
    
    const filtered = multas.filter(multa => {
      const multaDate = parseData(multa.Data_Cometimento)
      if (!multaDate) return false
      return multaDate >= startDate
    })

    const motorista = filtered.filter(m => 
      m.Resposabilidade?.toLowerCase() === 'motorista'
    ).length

    const empresa = filtered.filter(m => 
      m.Resposabilidade?.toLowerCase() === 'empresa'
    ).length

    const total = motorista + empresa

    return {
      chartData: [
        { 
          name: 'Motorista', 
          value: motorista, 
          color: COLORS.motorista,
          percentage: total > 0 ? ((motorista / total) * 100).toFixed(1) : '0'
        },
        { 
          name: 'Empresa', 
          value: empresa, 
          color: COLORS.empresa,
          percentage: total > 0 ? ((empresa / total) * 100).toFixed(1) : '0'
        },
      ].filter(item => item.value > 0),
      total,
      motorista,
      empresa
    }
  }, [multas, period])

  const { chartData, total } = filteredData

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            Responsabilidade
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="text-xs h-8 w-[140px]"
            >
              {periodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <Button
                variant={chartType === 'pie' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2 rounded-none"
                onClick={() => setChartType('pie')}
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2 rounded-none border-l"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {total === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-muted-foreground font-medium">Sem dados para o período</p>
            </div>
          </div>
        ) : chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percentage }) => `${name} ${percentage}%`}
                labelLine={{ stroke: '#64748b' }}
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
                formatter={(value, name) => [`${value} multa(s)`, name]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span style={{ color: '#0f172a' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 12 }}
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
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
