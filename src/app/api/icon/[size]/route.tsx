import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  req: NextRequest,
  { params }: { params: { size: string } }
) {
  const size   = Math.min(512, Math.max(16, Number(params.size) || 192))
  const isStaff = req.nextUrl.searchParams.get('staff') === '1'

  const bg   = isStaff ? '#15101F' : '#5B21B6'
  const ring = isStaff ? '#A78BFA' : 'white'
  const dot  = isStaff ? '#A78BFA' : 'white'

  const radius = Math.round(size * 0.219)
  const ringS  = Math.round(size * 0.664)
  const ringB  = Math.max(3, Math.round(size * 0.051))
  const dotS   = Math.round(size * 0.227)

  return new ImageResponse(
    (
      <div
        style={{
          width: size, height: size,
          background: bg,
          borderRadius: radius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: ringS, height: ringS,
            borderRadius: '50%',
            border: `${ringB}px solid ${ring}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: dotS, height: dotS,
              borderRadius: '50%',
              background: dot,
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
