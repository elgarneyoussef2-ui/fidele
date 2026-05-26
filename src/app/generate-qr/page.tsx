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
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#5B21B6', light: '#ffffff' } })
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
          <h1 className="text-3xl font-display italic text-foreground leading-none">Générer un QR Code</h1>
          <p className="eyebrow mt-1 text-primary">Saisir le montant pour créditer les points du client.</p>
        </div>

        {!qrDataUrl && (
          <Card className="shadow-card border-none">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs eyebrow text-muted-foreground">Montant payé (MAD)</Label>
                <div className="relative">
                  <Input
                    id="amount" type="number" min={1} placeholder="Ex: 150"
                    value={amount} onChange={e => { setAmount(e.target.value); setQrDataUrl(''); setTokenId(null) }}
                    className="text-lg pr-16 rounded-xl border-border/60 num-mono" autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">MAD</span>
                </div>
              </div>

              {amountNum > 0 && (
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <span className="text-sm text-primary font-medium">Points à créditer</span>
                  <span className="font-bold text-primary text-xl num-mono">{pts} pts</span>
                </div>
              )}

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl shadow-sm gap-2"
                onClick={generateQR}
                disabled={amountNum <= 0 || loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
                Générer QR
              </Button>
            </CardContent>
          </Card>
        )}

        {qrDataUrl && (
          <Card className="shadow-card border-none">
            <CardContent className="p-8 flex flex-col items-center gap-6">
              <div className="bg-white p-6 rounded-2xl border-2 border-primary/10 shadow-sm">
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
              </div>

              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 px-4 py-2 rounded-full">
                <ShieldCheck className="h-4 w-4" />
                À usage unique — ce QR sera invalide après scan
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Présentez ce QR au client — <strong className="text-foreground num-mono">{pts} pts</strong> pour <strong className="text-foreground num-mono">{amountNum} MAD</strong>
              </p>

              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1 gap-2 rounded-xl h-11" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimer
                </Button>
                <Button asChild className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 shadow-sm">
                  <a href={qrDataUrl} download={`qr-${amount}mad.png`}>
                    <Download className="h-4 w-4" /> Télécharger
                  </a>
                </Button>
              </div>

              <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary rounded-xl" onClick={reset}>
                <RefreshCw className="h-4 w-4" /> Nouveau QR
              </Button>
            </CardContent>
          </Card>
        )}

        {!qrDataUrl && !loading && amountNum <= 0 && (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground/30">
                <QrCode className="h-20 w-20" strokeWidth={1} />
                <p className="text-sm font-medium">Entrez un montant pour générer le QR</p>
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
