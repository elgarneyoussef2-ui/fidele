import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/client/data?phone=0612345678
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'phone requis' }, { status: 400 })

  const sb = adminSupabase()

  // All client records for this phone (one per restaurant)
  const { data: clients, error } = await sb
    .from('clients')
    .select('*, restaurants(id, name)')
    .eq('phone', phone)
    .order('points_balance', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recent visits per client
  const withActivity = await Promise.all(
    (clients ?? []).map(async (c: any) => {
      const { data: visits } = await sb
        .from('visits')
        .select('id, amount_paid, points_earned, created_at')
        .eq('client_id', c.id)
        .order('created_at', { ascending: false })
        .limit(20)

      return { ...c, visits: visits ?? [] }
    })
  )

  return NextResponse.json(withActivity)
}
