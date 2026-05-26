import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await createAdminClient()

  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!restaurant) return NextResponse.json([])

  const since = new Date()
  since.setDate(since.getDate() - 89)
  since.setHours(0, 0, 0, 0)

  const { data: rows } = await (admin.from('visits') as any)
    .select('created_at')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', since.toISOString())

  // Aggregate by date
  const counts: Record<string, number> = {}
  for (const row of rows ?? []) {
    const day = row.created_at.slice(0, 10)
    counts[day] = (counts[day] ?? 0) + 1
  }

  // Fill all 90 days (0 for missing)
  const result = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, visites: counts[key] ?? 0 })
  }

  return NextResponse.json(result)
}
