import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const secret = () => new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-in-production'
)
const ALG = 'HS256'

export const RESTAURANT_COOKIE = 'fidele_restaurant_session'

export const COOKIE_OPTS = {
  httpOnly:  true,
  path:      '/',
  sameSite:  'lax' as const,
  secure:    process.env.NODE_ENV === 'production',
  maxAge:    60 * 60 * 8, // 8 h
}

export async function signRestaurantSession(restaurantId: string): Promise<string> {
  return new SignJWT({ restaurantId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret())
}

export async function verifyRestaurantSession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return (payload.restaurantId as string) ?? null
  } catch {
    return null
  }
}

/** For use in API route handlers (NextRequest) */
export async function getRestaurantId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(RESTAURANT_COOKIE)?.value
  if (!token) return null
  return verifyRestaurantSession(token)
}
