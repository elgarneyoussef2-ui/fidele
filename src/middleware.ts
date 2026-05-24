import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login', '/join', '/client', '/api/client', '/api/admin/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin routes ── separate cookie-based auth
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()
    const ok = request.cookies.get('taghra_admin')?.value
    if (!ok) return NextResponse.redirect(new URL('/admin/login', request.url))
    return NextResponse.next()
  }

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
    || pathname.startsWith('/_next')
    || pathname.startsWith('/api/webhooks')
    || pathname.startsWith('/api/admin')

  // Refresh Supabase session and read user
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as any))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
