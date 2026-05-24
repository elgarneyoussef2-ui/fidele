'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { QrCode, Download, Printer, Loader2 } from 'lucide-react'
import AppShell from '@/components/dashboard/AppShell'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'

const POINTS_PER_10_MAD = 1

export default function GenerateQRPage() {
  const [amount,       setAmount]       = useState('')
  const [qrDataUrl,    setQrDataUrl]    = useState('')
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  // Load restaurant ID for the logged-in user
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await (supabase.from('restaurants') as any)
        .select('id')
        .eq('owner_id', user.id)
        .single()
      if (data) setRestaurantId(data.id)
    }
    load()
  }, [])

  const amountNum = Number(amount)
  const pts       = amountNum > 0 ? Math.floor(amountNum / 10) * POINTS_PER_10_MAD : 0

  useEffect(() => {
    if (amountNum > 0 && restaurantId) {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      QRCode.toDataURL(`${origin}/join?restaurantId=${restaurantId}&amount=${amount}`, {
        width: 280, margin: 2, color: { dark: '#185FA5', light: '#ffffff' },
      }).then(setQrDataUrl).catch(console.error)
    } else {
      setQrDataUrl('')
    }
  }, [amount, amountNum, restaurantId])

  return (
    <AppShell>
      <div className="p-6 max-w-lg mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Générer un QR Code</h1>
          <p className="text-gray-500 text-sm mt-0.5">Saisir le montant pour créditer les points du client.</p>
        </div>

        {!restaurantId && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement du restaurant…
          </div>
        )}

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant payé (MAD)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  placeholder="Ex: 150"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="text-lg pr-16"
                  autoFocus
                  disabled={!restaurantId}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">MAD</span>
              </div>
            </div>

            {amountNum > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-sm text-blue-700">Points à créditer</span>
                <span className="font-bold text-[#185FA5] text-lg">{pts} pts</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            {qrDataUrl ? (
              <div className="space-y-5 w-full flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl border-2 border-[#185FA5]/20 shadow-sm">
                  <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Présentez ce QR code au client — il sera redirigé vers son profil de fidélité.
                </p>
                <div className="flex w-full gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Imprimer
                  </Button>
                  <Button asChild className="flex-1 gap-2 bg-[#185FA5] hover:bg-[#124880]">
                    <a href={qrDataUrl} download={`qr-${amount}mad.png`}>
                      <Download className="h-4 w-4" /> Télécharger
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center gap-3 text-gray-300">
                <QrCode className="h-20 w-20" strokeWidth={1} />
                <p className="text-sm text-gray-400">Le QR code apparaîtra ici</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body > *:not(#print-qr) { display: none !important; }
          img[alt="QR Code"] { display: block; width: 80vmin !important; height: 80vmin !important; margin: auto; }
        }
      `}</style>
    </AppShell>
  )
}
