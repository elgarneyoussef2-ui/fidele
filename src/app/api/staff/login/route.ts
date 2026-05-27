export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyPassword, hashPassword } from '@/lib/password'

export async function POST(req: NextRequest) {
  const { name, password, restaurantId } = await req.json().catch(() => ({}))
  if (!name || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const admin = await createAdminClient()

  // restaurantId must be provided; fall back to first restaurant for legacy clients
  let targetRestaurantId = restaurantId
  if (!targetRestaurantId) {
    const { data: restaurant } = await (admin.from('restaurants') as any)
      .select('id').order('created_at', { ascending: true }).limit(1).single()
    if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
    targetRestaurantId = restaurant.id
  }

  const { data: member } = await (admin.from('staff') as any)
    .select('id, name, role, password_hash')
    .eq('restaurant_id', targetRestaurantId)
    .ilike('name', name.trim())
    .limit(1)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Nom introuvable' }, { status: 404 })

  const ok = await verifyPassword(password, member.password_hash ?? '')
  if (!ok) return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })

  // Upgrade legacy SHA-256 hash to bcrypt silently
  if (member.password_hash && !member.password_hash.startsWith('$2')) {
    const upgraded = await hashPassword(password)
    await (admin.from('staff') as any).update({ password_hash: upgraded }).eq('id', member.id)
  }

  return NextResponse.json({ id: member.id, name: member.name, role: member.role })
}
