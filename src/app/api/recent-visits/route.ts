export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantId } from '@/lib/session'

export async function GET(req: NextRequest) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json([], { status: 401 })

  const admin = await createAdminClient()

  const { data } = await (admin.from('visits') as any)
    .select('id, points_earned, amount_paid, created_at, clients(name)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json(data ?? [])
}
