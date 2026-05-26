'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type Period = 7 | 30 | 90
type Row = { date: string; visites: number }

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-primary">
        {payload[0].value} visite{(payload[0].value ?? 0) > 1 ? 's' : ''}
      </p>
    </div>
  )
}

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '3 mois', value: 90 },
]

export default function VisitsChart() {
  const [period, setPeriod] = useState<Period>(30)
  const [raw, setRaw] = useState<Row[]>([])

  useEffect(() => {
    fetch('/api/visits-chart')
      .then(r => r.ok ? r.json() : [])
      .then(setRaw)
  }, [])

  const data = useMemo(() => {
    const slice = raw.slice(raw.length - period)
    return slice.map(r => ({
      ...r,
      label: format(parseISO(r.date), period <= 7 ? 'EEE d' : 'd MMM', { locale: fr }),
    }))
  }, [raw, period])

  const total = data.reduce((s, d) => s + d.visites, 0)
  const tickInterval = period === 7 ? 0 : period === 30 ? 4 : 9
  const isEmpty = total === 0

  return (
    <Card className="shadow-card border-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm eyebrow">Visites</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-bold text-foreground num-mono">{total}</span> visite{total > 1 ? 's' : ''} sur{' '}
              {period === 90 ? '3 mois' : `${period} jours`}
            </p>
          </div>

          <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isEmpty ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Aucune visite sur cette période.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#5B21B6', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Line
                type="monotone"
                dataKey="visites"
                stroke="#5B21B6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: '#5B21B6', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
