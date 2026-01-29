import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import type { Multa } from '@/lib/supabase'

interface MultasPeriodChartProps {
  multas: Multa[]
}

// Função para converter data "20/01/2026" para Date
function parseData(data: string): Date | null {
  if (!data) return null
  const parts = data.split('/')
  if (parts.length !== 3) return null
  const [dia, mes, ano] = parts
  return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
}

export function MultasPeriodChart({ multas }: MultasPeriodChartProps) {
  const chartData = useMemo(() => {
    // Agrupar multas por mês/ano
    const monthlyData: Record<string, { date: Date, count: number, label: string }> = {}
    
    multas.forEach(multa => {
      const data = parseData(multa.Data_Cometimento)
      if (data) {
        // Criar chave única para o mês (YYYY-MM para ordenação)
        const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
        const label = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        
        if (!monthlyData[key]) {
          monthlyData[key] = { 
            date: new Date(data.getFullYear(), data.getMonth(), 1),
            count: 0, 
            label 
          }
        }
        monthlyData[key].count++
      }
    })
    
    // Ordenar do mais antigo para o mais recente
    return Object.entries(monthlyData)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, value]) => ({
        name: value.label,
        value: value.count
      }))
  }, [multas])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          Multas por Período
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-muted-foreground font-medium">Sem dados para exibir</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval={chartData.length > 12 ? Math.floor(chartData.length / 12) : 0}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={35}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px'
                }}
                labelStyle={{ color: '#0f172a', fontWeight: 600, marginBottom: '4px' }}
                formatter={(value) => [`${value} multa(s)`, 'Quantidade']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorValue)"
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#16a34a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        
        {/* Resumo */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-slate-500">Total de Multas</p>
                <p className="text-lg font-bold text-slate-700">
                  {chartData.reduce((acc, item) => acc + item.value, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Meses Analisados</p>
                <p className="text-lg font-bold text-slate-700">{chartData.length}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Média Mensal</p>
                <p className="text-lg font-bold text-slate-700">
                  {(chartData.reduce((acc, item) => acc + item.value, 0) / chartData.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
