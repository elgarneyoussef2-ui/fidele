export const dynamic = 'force-dynamic'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const admin = await createAdminClient()

  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) return NextResponse.json([])

  const since = new Date()
  since.setDate(since.getDate() - 89)
  since.setHours(0, 0, 0, 0)

  const { data: rows } = await (admin.from('visits') as any)
    .select('created_at')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', since.toISOString())

  const counts: Record<string, number> = {}
  for (const row of rows ?? []) {
    const day = row.created_at.slice(0, 10)
    counts[day] = (counts[day] ?? 0) + 1
  }

  const result = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, visites: counts[key] ?? 0 })
  }

  return NextResponse.json(result)
}
