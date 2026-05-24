import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_USER = 'admin'
const COOKIE_NAME = 'taghra_admin'
const COOKIE_OPTS = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 8, // 8 h
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const ADMIN_PASS = process.env.ADMIN_PASSWORD
  if (!ADMIN_PASS) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD non configuré.' }, { status: 500 })
  }

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, 'authenticated', COOKIE_OPTS)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
