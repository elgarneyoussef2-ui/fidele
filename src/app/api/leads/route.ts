import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, email, phone, location } = body

  if (!name || !email || !phone)
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  // Basic length limits to prevent spam
  if (
    typeof name     !== 'string' || name.length     > 120 ||
    typeof email    !== 'string' || email.length    > 254 ||
    typeof phone    !== 'string' || phone.length    > 30  ||
    (location && (typeof location !== 'string' || location.length > 200))
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Simple email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })

  try {
    const admin = await createAdminClient()
    await (admin.from('leads') as any).insert({
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      phone:    phone.trim(),
      location: location?.trim() ?? null,
    })
  } catch {
    // Table may not exist yet — silently continue
  }

  return NextResponse.json({ ok: true })
}
