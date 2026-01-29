import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Truck } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import type { Multa } from '@/lib/supabase'

type PeriodType = 'all' | 'week' | 'month' | 'quarter' | 'semester' | 'year'

interface VehicleChartProps {
  multas: Multa[]
  topN?: number
}

const COLORS = [
  '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
  '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'
]

// Veículos a serem ignorados
const IGNORED_VEHICLES = ['SCE2C20', 'SCN7E46']

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

export function VehicleChart({ multas, topN = 10 }: VehicleChartProps) {
  const [period, setPeriod] = useState<PeriodType>('all')

  const { chartData, totalVehicles, othersCount, othersMultas, filteredTotal } = useMemo(() => {
    const startDate = getStartDate(period)
    
    // Filtrar por período e ignorar veículos específicos
    const filtered = multas.filter(multa => {
      // Ignorar veículos da lista
      if (IGNORED_VEHICLES.includes(multa.Veiculo)) {
        return false
      }
      
      // Filtrar por período
      if (startDate) {
        const multaDate = parseData(multa.Data_Cometimento)
        if (!multaDate || multaDate < startDate) return false
      }
      
      return true
    })

    // Agrupar multas por veículo
    const vehicleCount: Record<string, number> = {}
    
    filtered.forEach(multa => {
      if (multa.Veiculo) {
        vehicleCount[multa.Veiculo] = (vehicleCount[multa.Veiculo] || 0) + 1
      }
    })
    
    // Ordenar por quantidade (maior para menor)
    const sorted = Object.entries(vehicleCount)
      .sort(([, a], [, b]) => b - a)
    
    const totalVehicles = sorted.length
    
    // Pegar top N
    const topVehicles = sorted.slice(0, topN)
    const others = sorted.slice(topN)
    
    const othersCount = others.length
    const othersMultas = others.reduce((acc, [, count]) => acc + count, 0)
    
    const chartData = topVehicles.map(([vehicle, count], index) => ({
      name: vehicle,
      value: count,
      color: COLORS[index % COLORS.length]
    }))
    
    return { chartData, totalVehicles, othersCount, othersMultas, filteredTotal: filtered.length }
  }, [multas, topN, period])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            Top {topN} Veículos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              options={periodOptions}
              className="text-sm h-9 w-36"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {totalVehicles} veículos
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                <Truck className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-muted-foreground font-medium">Sem dados para exibir</p>
              <p className="text-sm text-muted-foreground mt-1">Nenhuma multa no período selecionado</p>
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis 
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  allowDecimals={false}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.15)',
                    padding: '12px 16px'
                  }}
                  formatter={(value) => [`${value} multa(s)`, 'Quantidade']}
                  labelStyle={{ color: '#0f172a', fontWeight: 600, marginBottom: '4px' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={25}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Resumo */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-slate-500">Top {topN}</p>
                  <p className="text-lg font-bold text-blue-600">
                    {chartData.reduce((acc, item) => acc + item.value, 0)} multas
                  </p>
                </div>
                {othersCount > 0 && (
                  <div className="text-center">
                    <p className="text-slate-500">Outros {othersCount} veículos</p>
                    <p className="text-lg font-bold text-slate-600">
                      {othersMultas} multas
                    </p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-slate-500">Total Geral</p>
                  <p className="text-lg font-bold text-slate-700">
                    {filteredTotal} multas
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
