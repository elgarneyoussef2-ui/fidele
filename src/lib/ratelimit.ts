import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

let limiter: Ratelimit | null = null

// Nettoie une variable d'env : supprime les guillemets et espaces parasites
function cleanEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '')
}

function getLimiter(): Ratelimit | null {
  const url   = cleanEnv(process.env.UPSTASH_REDIS_REST_URL)
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN)
  if (!url || !token) return null

  if (!limiter) {
    try {
      limiter = new Ratelimit({
        redis:     new Redis({ url, token }),
        limiter:   Ratelimit.slidingWindow(10, '60 s'),
        analytics: false,
      })
    } catch {
      return null
    }
  }
  return limiter
}

/** Retourne une réponse 429 si l'IP dépasse la limite, null sinon.
 *  En cas d'erreur Redis, laisse passer (fail open) pour ne pas bloquer l'app. */
export async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
  const rl = getLimiter()
  if (!rl) return null

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  try {
    const { success, remaining } = await rl.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans une minute.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }
    return null
  } catch {
    return null
  }
}
