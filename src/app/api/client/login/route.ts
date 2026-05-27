export const dynamic = 'force-dynamic'

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, hashPassword } from '@/lib/password'
import { rateLimit } from '@/lib/ratelimit'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/client/login  { phone, password }
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req)
  if (limited) return limited

  const { phone, password } = await req.json().catch(() => ({}))
  if (!phone || !password)
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const sb = adminSupabase()
  const { data: client } = await sb
    .from('clients')
    .select('id, name, password_hash')
    .eq('phone', phone)
    .limit(1)
    .maybeSingle()

  if (!client)
    return NextResponse.json({ error: 'Aucun compte trouvé pour ce numéro.' }, { status: 404 })

  const ok = await verifyPassword(password, client.password_hash ?? '')
  if (!ok)
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })

  // Upgrade legacy SHA-256 hash to bcrypt silently
  if (client.password_hash && !client.password_hash.startsWith('$2')) {
    const upgraded = await hashPassword(password)
    await sb.from('clients').update({ password_hash: upgraded }).eq('id', client.id)
  }

  return NextResponse.json({ name: client.name })
}
