export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantId } from '@/lib/session'

export async function GET(req: NextRequest) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()
  const { data } = await (admin.from('restaurants') as any)
    .select('id, name, description, logo_url, cover_url, accent_color, phone, points_expiry_months, mad_per_point')
    .eq('id', restaurantId)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, description, logo_url, cover_url, accent_color, phone, points_expiry_months, mad_per_point } = body

  const updates: Record<string, any> = {}
  if (name                 !== undefined) updates.name                 = name
  if (description          !== undefined) updates.description          = description
  if (logo_url             !== undefined) updates.logo_url             = logo_url
  if (cover_url            !== undefined) updates.cover_url            = cover_url
  if (accent_color         !== undefined) updates.accent_color         = accent_color
  if (phone                !== undefined) updates.phone                = phone
  if (points_expiry_months !== undefined) updates.points_expiry_months = points_expiry_months
  if (mad_per_point        !== undefined) updates.mad_per_point        = Math.max(1, Number(mad_per_point))

  const admin = await createAdminClient()
  const { error } = await (admin.from('restaurants') as any)
    .update(updates)
    .eq('id', restaurantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
