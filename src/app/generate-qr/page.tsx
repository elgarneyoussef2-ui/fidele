'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { QrCode, Download, Printer, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import AppShell from '@/components/dashboard/AppShell'
import QRCode from 'qrcode'

const POINTS_PER_10_MAD = 1

export default function GenerateQRPage() {
  const [amount,    setAmount]    = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [tokenId,   setTokenId]   = useState<string | null>(null)

  const amountNum = Number(amount)
  const pts       = amountNum > 0 ? Math.floor(amountNum / 10) * POINTS_PER_10_MAD : 0

  async function generateQR() {
    if (amountNum <= 0) return
    setLoading(true)
    setQrDataUrl('')
    setTokenId(null)
    try {
      const res  = await fetch('/api/qr-tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amountNum }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const origin = window.location.origin
      const url    = `${origin}/join?token=${data.id}`
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#185FA5', light: '#ffffff' } })
      setQrDataUrl(dataUrl)
      setTokenId(data.id)
    } catch (err: any) {
      alert(err.message ?? 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setQrDataUrl('')
    setTokenId(null)
    setAmount('')
  }

  return (
    <AppShell>
      <div className="p-6 max-w-lg mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Générer un QR Code</h1>
          <p className="text-gray-500 text-sm mt-0.5">Saisir le montant pour créditer les points du client.</p>
        </div>

        {!qrDataUrl && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Montant payé (MAD)</Label>
                <div className="relative">
                  <Input
                    id="amount" type="number" min={1} placeholder="Ex: 150"
                    value={amount} onChange={e => { setAmount(e.target.value); setQrDataUrl(''); setTokenId(null) }}
                    className="text-lg pr-16" autoFocus
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

              <Button
                className="w-full bg-[#185FA5] hover:bg-[#124880] gap-2"
                onClick={generateQR}
                disabled={amountNum <= 0 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Générer QR
              </Button>
            </CardContent>
          </Card>
        )}

        {qrDataUrl && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-5">
              <div className="bg-white p-4 rounded-xl border-2 border-[#185FA5]/20 shadow-sm">
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                À usage unique — ce QR sera invalide après scan
              </div>

              <p className="text-sm text-gray-500 text-center">
                Présentez ce QR au client — <strong>{pts} pts</strong> pour <strong>{amountNum} MAD</strong>
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

              <Button variant="ghost" className="w-full gap-2 text-gray-500" onClick={reset}>
                <RefreshCw className="h-4 w-4" /> Nouveau QR
              </Button>
            </CardContent>
          </Card>
        )}

        {!qrDataUrl && !loading && amountNum <= 0 && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="py-14 flex flex-col items-center gap-3 text-gray-300">
                <QrCode className="h-20 w-20" strokeWidth={1} />
                <p className="text-sm text-gray-400">Entrez un montant pour générer le QR</p>
              </div>
            </CardContent>
          </Card>
        )}
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
