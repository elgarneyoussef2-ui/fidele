export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET() {
  const admin = await createAdminClient()
  const { data } = await (admin.from('restaurants') as any)
    .select('id, name, description, logo_url, cover_url, accent_color, phone')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { name, description, logo_url, cover_url, accent_color, phone, points_expiry_months } = body

  const admin = await createAdminClient()
  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, any> = {}
  if (name                 !== undefined) updates.name                 = name
  if (description          !== undefined) updates.description          = description
  if (logo_url             !== undefined) updates.logo_url             = logo_url
  if (cover_url            !== undefined) updates.cover_url            = cover_url
  if (accent_color         !== undefined) updates.accent_color         = accent_color
  if (phone                !== undefined) updates.phone                = phone
  if (points_expiry_months !== undefined) updates.points_expiry_months = points_expiry_months

  const { error } = await (admin.from('restaurants') as any)
    .update(updates)
    .eq('id', restaurant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
