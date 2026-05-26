export const dynamic = 'force-dynamic'

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const hashPassword = (p: string) => createHash('sha256').update(p).digest('hex')

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/client/login  { phone, password }
export async function POST(req: NextRequest) {
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

  if (client.password_hash !== hashPassword(password))
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })

  return NextResponse.json({ name: client.name })
}
