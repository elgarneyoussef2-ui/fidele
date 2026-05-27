export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'

const hash = (p: string) => createHash('sha256').update(p).digest('hex')

export async function POST(req: NextRequest) {
  const { name, password } = await req.json().catch(() => ({}))
  if (!name || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').order('created_at', { ascending: true }).limit(1).single()
  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { data: member } = await (admin.from('staff') as any)
    .select('id, name, role, password_hash')
    .eq('restaurant_id', restaurant.id)
    .ilike('name', name.trim())
    .limit(1)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Nom introuvable' }, { status: 404 })
  if (member.password_hash !== hash(password))
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })

  return NextResponse.json({ id: member.id, name: member.name, role: member.role })
}
