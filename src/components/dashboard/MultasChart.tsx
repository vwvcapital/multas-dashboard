import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
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

interface MultasChartProps {
  data: Record<string, number>
  title: string
  color?: string
}

export function MultasChart({ data, title, color = '#3b82f6' }: MultasChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length === 0 ? (
          <div className="h-[200px] sm:h-[280px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-muted-foreground font-medium">Sem dados para exibir</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
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
                labelStyle={{ color: '#0f172a', fontWeight: 600, marginBottom: '4px' }}
                itemStyle={{ color: '#64748b' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#gradient-${color})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
