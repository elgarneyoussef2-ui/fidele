import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function requireAdmin(req: NextRequest) {
  return req.cookies.get('taghra_admin')?.value === 'authenticated'
}

// GET — list all leads
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const sb = adminSupabase()
  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// PATCH — update status or notes
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, status, notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (status !== undefined) updates.status = status
  if (notes  !== undefined) updates.notes  = notes

  const sb = adminSupabase()
  const { error } = await sb.from('leads').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — remove a lead
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const sb = adminSupabase()
  const { error } = await sb.from('leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
