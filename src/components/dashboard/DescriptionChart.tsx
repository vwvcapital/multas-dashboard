import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PieChart as PieChartIcon, BarChart3, FileText } from 'lucide-react'
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

interface DescriptionChartProps {
  multas: Multa[]
}

// Cores para diferentes descrições
const CHART_COLORS = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#22c55e', // green
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
]

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

// Função para truncar texto longo
function truncateText(text: string, maxLength: number = 30): string {
  if (!text) return 'Sem descrição'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function DescriptionChart({ multas }: DescriptionChartProps) {
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

    // Agrupar por descrição
    const descriptionCounts: Record<string, number> = {}
    filtered.forEach(multa => {
      const desc = multa.Descricao || 'Sem descrição'
      descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1
    })

    const total = filtered.length

    // Converter para array e ordenar por quantidade (decrescente)
    const chartData = Object.entries(descriptionCounts)
      .map(([name, value], index) => ({
        name,
        shortName: truncateText(name, 25),
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
        percent: total > 0 ? (value / total) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Limitar a 8 itens para melhor visualização

    return { chartData, total }
  }, [multas, period])

  const { chartData, total } = filteredData

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            Tipos de Infração
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              options={periodOptions}
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="text-xs h-8 w-[140px]"
            />
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
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-muted-foreground font-medium">Sem dados para o período</p>
            </div>
          </div>
        ) : chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
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
                  padding: '12px 16px',
                  maxWidth: '300px'
                }}
                formatter={(value, _name, props) => {
                  const fullName = (props as { payload?: { name?: string } }).payload?.name || ''
                  return [`${value ?? 0} multa(s)`, fullName]
                }}
              />
              <Legend 
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value: string) => <span style={{ color: '#0f172a' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                type="category"
                dataKey="shortName"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={95}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px',
                  maxWidth: '300px'
                }}
                formatter={(value, _name, props) => {
                  const fullName = (props as { payload?: { name?: string } }).payload?.name || ''
                  return [`${value ?? 0} multa(s)`, fullName]
                }}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.shortName === String(label))
                  return item?.name || String(label)
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={30}>
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
