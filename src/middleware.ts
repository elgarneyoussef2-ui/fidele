import { NextResponse, type NextRequest } from 'next/server'
import { verifyRestaurantSession, RESTAURANT_COOKIE } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes — protected by taghra_admin cookie
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()
    if (!request.cookies.get('taghra_admin')?.value)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    return NextResponse.next()
  }

  // Dashboard routes — verify signed JWT session
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get(RESTAURANT_COOKIE)?.value
    if (!token) return NextResponse.redirect(new URL('/', request.url))

    const restaurantId = await verifyRestaurantSession(token)
    if (!restaurantId) {
      // Token invalid or expired — clear cookie and redirect
      const res = NextResponse.redirect(new URL('/', request.url))
      res.cookies.set(RESTAURANT_COOKIE, '', { path: '/', maxAge: 0 })
      return res
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
