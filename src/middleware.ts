import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes — protected by taghra_admin cookie
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()
    if (!request.cookies.get('taghra_admin')?.value)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    return NextResponse.next()
  }

  // Dashboard routes — protected by restaurant session cookie
  if (pathname.startsWith('/dashboard')) {
    if (!request.cookies.get('fidele_restaurant_session')?.value)
      return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
