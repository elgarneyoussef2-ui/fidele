'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { QrCode, Download, Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'

export default function GenerateQRPage() {
  const [amount, setAmount] = useState<string>('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Simulation de l'ID du restaurant (à récupérer via l'auth normalement)
  const restaurantId = "867d37b9-065f-46af-b1e7-4a837f4881fa"

  useEffect(() => {
    if (amount && Number(amount) > 0) {
      // On utilise l'origine actuelle du navigateur pour construire l'URL
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${origin}/join?restaurantId=${restaurantId}&amount=${amount}`

      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err))
    } else {
      setQrDataUrl('')
    }
  }, [amount, restaurantId])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 min-h-screen bg-gray-50">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Générer un QR Code</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Montant de la visite</CardTitle>
            <CardDescription>
              Entrez le montant payé par le client pour générer les points correspondants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (MAD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 150"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            {amount && Number(amount) > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-gray-600">
                  Points estimés : <span className="font-bold text-primary">{Math.floor(Number(amount) / 10)} pts</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center p-6">
          {qrDataUrl ? (
            <div className="space-y-6 w-full flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-inner border">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={handlePrint}>
                  <Printer size={16} className="mr-2" /> Imprimer
                </Button>
                <Button asChild className="flex-1">
                  <a href={qrDataUrl} download={`qr-code-${amount}mad.png`}>
                    <Download size={16} className="mr-2" /> Sauver
                  </a>
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Ce QR code redirigera le client vers le formulaire d'inscription/connexion pour créditer ses points.
              </p>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center space-y-4 text-gray-300">
              <QrCode size={80} strokeWidth={1} />
              <p className="text-sm">Entrez un montant pour générer le QR Code</p>
            </div>
          )}
        </Card>
      </div>

      {/* Style pour l'impression du QR Code uniquement */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.p-4.rounded-xl.shadow-inner.border, .bg-white.p-4.rounded-xl.shadow-inner.border img {
            visibility: visible;
          }
          .bg-white.p-4.rounded-xl.shadow-inner.border {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 80% !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
