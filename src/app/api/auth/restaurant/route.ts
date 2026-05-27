import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

function makeClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  const supabase = makeClient(req, response)
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  return response
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ ok: true })
  const supabase = makeClient(req, response)
  await supabase.auth.signOut()
  return response
}
