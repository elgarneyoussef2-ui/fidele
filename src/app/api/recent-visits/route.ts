export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await createAdminClient()

  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').order('created_at', { ascending: true }).limit(1).single()
  if (!restaurant) return NextResponse.json([])

  const { data } = await (admin.from('visits') as any)
    .select('id, points_earned, amount_paid, created_at, clients(name)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json(data ?? [])
}
