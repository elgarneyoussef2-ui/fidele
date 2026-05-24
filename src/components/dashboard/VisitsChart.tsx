'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

type Period = 7 | 30 | 90

function generateMockData(days: number) {
  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dow  = date.getDay() // 0=dim, 6=sam
    const isWeekend = dow === 0 || dow === 6

    // Base aléatoire + boost weekend
    const base    = Math.floor(Math.random() * 15) + 8
    const weekend = isWeekend ? Math.floor(Math.random() * 20) + 10 : 0
    // Légère tendance haussière sur le temps
    const trend   = Math.floor((days - i) / days * 8)

    data.push({
      date,
      label: format(date, days <= 7 ? 'EEE d' : 'd MMM', { locale: fr }),
      visites: base + weekend + trend,
    })
  }
  return data
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-[#185FA5]">
        {payload[0].value} visite{(payload[0].value ?? 0) > 1 ? 's' : ''}
      </p>
    </div>
  )
}

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 jours',  value: 7  },
  { label: '30 jours', value: 30 },
  { label: '3 mois',   value: 90 },
]

export default function VisitsChart() {
  const [period, setPeriod] = useState<Period>(30)

  const data = useMemo(() => generateMockData(period), [period])

  const total = data.reduce((s, d) => s + d.visites, 0)

  // N'afficher qu'un label sur N pour éviter l'encombrement
  const tickInterval = period === 7 ? 0 : period === 30 ? 4 : 9

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Visites</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-semibold text-gray-900">{total}</span> visites sur {period === 90 ? '3 mois' : `${period} jours`}
            </p>
          </div>

          {/* Filtres */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === value
                    ? 'bg-white text-[#185FA5] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#185FA5', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey="visites"
              stroke="#185FA5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#185FA5', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
