import { getTokenData } from './actions'
import JoinForm from './JoinForm'

export default async function JoinPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token

  if (!token) return <ErrorPage message="QR code invalide." sub="Demandez au serveur de générer un nouveau QR." />

  const tokenData = await getTokenData(token)
  if (!tokenData) return <ErrorPage message="QR code introuvable." sub="Ce QR code n'existe pas ou a expiré." />
  if (tokenData.used_at) return <ErrorPage message="QR déjà utilisé." sub="Ce QR code a déjà été scanné. Demandez un nouveau QR au serveur." />

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4 pt-12">
      <div className="w-full max-w-md">
        <JoinForm
          token={token}
          restaurantId={tokenData.restaurant_id}
          restaurantName={tokenData.restaurants?.name ?? 'le restaurant'}
          amount={Number(tokenData.amount)}
        />
      </div>
    </div>
  )
}

function ErrorPage({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-4xl mb-4">✕</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{message}</h1>
      <p className="text-gray-500 text-sm">{sub}</p>
    </div>
  )
}
