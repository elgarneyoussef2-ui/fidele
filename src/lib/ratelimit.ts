import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

let limiter: Ratelimit | null = null

function getLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!limiter) {
    limiter = new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(10, '60 s'),
      analytics: false,
    })
  }
  return limiter
}

/** Returns a 429 response if the IP is over limit, null otherwise. */
export async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
  const rl = getLimiter()
  if (!rl) return null // Upstash not configured → allow

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const { success, remaining } = await rl.limit(ip)
  if (!success) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans une minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }
  return null
}
