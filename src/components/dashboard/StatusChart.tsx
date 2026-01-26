import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'

interface StatusChartProps {
  pendentes: number
  pagas: number
  recorridas: number
  canceladas: number
}

const COLORS = {
  pendentes: '#f59e0b',
  pagas: '#22c55e',
  recorridas: '#2563eb',
  canceladas: '#94a3b8'
}

export function StatusChart({ pendentes, pagas, recorridas, canceladas }: StatusChartProps) {
  const data = [
    { name: 'Pendentes', value: pendentes, color: COLORS.pendentes },
    { name: 'Pagas', value: pagas, color: COLORS.pagas },
    { name: 'Recorridas', value: recorridas, color: COLORS.recorridas },
    { name: 'Canceladas', value: canceladas, color: COLORS.canceladas },
  ].filter(item => item.value > 0)

  const total = pendentes + pagas + recorridas + canceladas

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Status das Multas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados para exibir
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#64748b' }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
        )}
      </CardContent>
    </Card>
  )
}
