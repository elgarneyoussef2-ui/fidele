'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Star, Smartphone, User, ArrowRight, Lock, Download, Share } from 'lucide-react'
import { processJoinWithToken } from './actions'
import { T, type Lang } from '@/lib/i18n'

interface Props {
  token: string
  restaurantId: string
  restaurantName: string
  amount: number
}

const JT = {
  fr: {
    install_title:   'Installer l\'app Fidèle',
    install_desc:    'Accédez à vos points depuis l\'écran d\'accueil.',
    install_btn:     'Ajouter à l\'écran d\'accueil',
    install_ios:     'Appuyez sur',
    install_ios2:    'puis « Sur l\'écran d\'accueil »',
    loyalty_points: 'Points Fidélité',
    receive_pts:    (pts: number, rName: string) => `Recevez ${pts} point${pts > 1 ? 's' : ''} chez ${rName}.`,
    enter_password: 'Entrez votre mot de passe pour valider.',
    create_account: 'Créez votre compte pour recevoir vos points.',
    bravo:          (name: string) => `Bravo, ${name} !`,
    pts_added:      'Vos points ont été ajoutés.',
    pts_earned:     'Points gagnés',
    new_balance:    (rName: string) => `Nouveau solde chez ${rName}`,
    points:         (n: number) => `${n} points`,
    see_wallet:     'Voir mon portefeuille →',
    redirect:       (s: number) => `Redirection dans ${s}s…`,
    phone_label:    'Numéro de téléphone',
    continue_btn:   'Continuer',
    password_label: 'Mot de passe',
    validate_btn:   'Valider',
    change_number:  '← Modifier le numéro',
    name_label:     'Votre nom complet',
    name_ph:        'Ex: Ahmed Alami',
    password_choose: 'Choisissez un mot de passe',
    create_btn:     'Créer mon compte & Créditer',
    unknown_error:  'Erreur inconnue',
    wrong_pw:       'Mot de passe incorrect.',
    lang_toggle:    'عربي',
  },
  ar: {
    install_title:   'تثبيت تطبيق Fidèle',
    install_desc:    'الوصول إلى نقاطك من الشاشة الرئيسية.',
    install_btn:     'إضافة إلى الشاشة الرئيسية',
    install_ios:     'اضغط على',
    install_ios2:    'ثم « إضافة إلى الشاشة الرئيسية »',
    loyalty_points: 'نقاط الولاء',
    receive_pts:    (pts: number, rName: string) => `احصل على ${pts} نقطة في ${rName}.`,
    enter_password: 'أدخل كلمة مرورك للتأكيد.',
    create_account: 'أنشئ حسابك لاستلام نقاطك.',
    bravo:          (name: string) => `أحسنت، ${name}!`,
    pts_added:      'تمت إضافة نقاطك.',
    pts_earned:     'النقاط المكتسبة',
    new_balance:    (rName: string) => `الرصيد الجديد لدى ${rName}`,
    points:         (n: number) => `${n} نقطة`,
    see_wallet:     'عرض محفظتي ←',
    redirect:       (s: number) => `إعادة التوجيه خلال ${s}s...`,
    phone_label:    'رقم الهاتف',
    continue_btn:   'متابعة',
    password_label: 'كلمة المرور',
    validate_btn:   'تأكيد',
    change_number:  'تعديل الرقم →',
    name_label:     'اسمك الكامل',
    name_ph:        'مثال: أحمد علمي',
    password_choose: 'اختر كلمة مرور',
    create_btn:     'إنشاء حسابي وإضافة النقاط',
    unknown_error:  'خطأ غير معروف',
    wrong_pw:       'كلمة مرور خاطئة.',
    lang_toggle:    'Français',
  },
}

export default function JoinForm({ token, restaurantId, restaurantName, amount }: Props) {
  const pts = Math.floor(amount / 10)

  const [lang, setLang] = useState<Lang>('fr')
  const jt = JT[lang]
  const isRtl = lang === 'ar'

  const [step,         setStep]         = useState<'phone' | 'password' | 'register' | 'success'>('phone')
  const [phone,        setPhone]        = useState('')
  const [name,         setName]         = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [newBalance,   setNewBalance]   = useState(0)
  const [clientName,   setClientName]   = useState('')
  const [countdown,    setCountdown]    = useState(4)
  const [isNewClient,  setIsNewClient]  = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isIOS,         setIsIOS]         = useState(false)
  const [isStandalone,  setIsStandalone]  = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fidele_lang') as Lang | null
    if (saved === 'fr' || saved === 'ar') setLang(saved)

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function toggleLang() {
    const next: Lang = lang === 'fr' ? 'ar' : 'fr'
    setLang(next)
    localStorage.setItem('fidele_lang', next)
  }

  useEffect(() => {
    if (step !== 'success') return
    if (countdown <= 0) { window.location.replace('/client'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [step, countdown])

  async function submit(clientName: string, pwd: string) {
    setLoading(true)
    setError('')
    const result = await processJoinWithToken({ token, phone, name: clientName, password: pwd })
    setLoading(false)
    if (!result.success) { setError(result.error ?? jt.unknown_error); return }
    setPointsEarned(result.pointsEarned!)
    setNewBalance(result.newBalance!)
    setClientName(result.name!)
    localStorage.setItem('fidele_client_phone', phone)
    localStorage.setItem('fidele_client_name', result.name!)
    setStep('success')
  }

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/client/data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      const existsAnywhere = Array.isArray(data) && data.length > 0
      const atThisResto    = Array.isArray(data) && data.some((c: any) => c.restaurant_id === restaurantId)

      if (atThisResto) {
        const n = data.find((c: any) => c.restaurant_id === restaurantId)?.name ?? ''
        setName(n)
        setIsNewClient(false)
        setStep('password')
      } else if (existsAnywhere) {
        const n = data[0].name ?? ''
        setName(n)
        setIsNewClient(false)
        setStep('password')
      } else {
        setIsNewClient(true)
        setStep('register')
      }
    } catch {
      setIsNewClient(true)
      setStep('register')
    } finally {
      setLoading(false)
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!isNewClient) {
      setLoading(true); setError('')
      const res = await fetch('/api/client/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      setLoading(false)
      if (!res.ok) { const d = await res.json(); setError(d.error ?? jt.wrong_pw); return }
      await submit(name, password)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    await submit(name, password)
  }

  const langBtn = (
    <button
      type="button"
      onClick={toggleLang}
      style={{ fontSize: 12, fontWeight: 700, color: '#5B21B6', background: '#EDE6FB', borderRadius: 99, padding: '5px 12px', border: '1px solid #C4B5FD', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      {jt.lang_toggle}
    </button>
  )

  if (step === 'success') {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>{langBtn}</div>
        <Card className="border-none shadow-none text-center space-y-6 py-8 bg-transparent">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100">
              <CheckCircle2 size={56} />
            </div>
          </div>
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">{jt.bravo(clientName)}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">{jt.pts_added}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 p-8 rounded-[22px] border border-primary/10">
              <p className="eyebrow text-primary mb-2">{jt.pts_earned}</p>
              <p className="text-6xl font-black text-primary num-mono">+{pointsEarned}</p>
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">{jt.new_balance(restaurantName)}</p>
              <p className="text-2xl font-bold text-foreground num-mono">{jt.points(newBalance)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-6">
            <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl" onClick={() => window.location.replace('/client')}>
              {jt.see_wallet}
            </Button>

            {/* Install prompt */}
            {!isStandalone && (installPrompt || isIOS) && (
              <div style={{ background: '#EDE6FB', border: '1px solid #C4B5FD', borderRadius: 20, padding: '16px 18px', textAlign: isRtl ? 'right' : 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#3B0764', marginBottom: 4 }}>{jt.install_title}</p>
                <p style={{ fontSize: 12, color: '#6D28D9', marginBottom: 12 }}>{jt.install_desc}</p>
                {installPrompt ? (
                  <button
                    type="button"
                    onClick={() => { installPrompt.prompt(); installPrompt.userChoice.then(() => setInstallPrompt(null)) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <Download size={15} />
                    {jt.install_btn}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5B21B6', fontWeight: 500 }}>
                    <Share size={15} />
                    <span>{jt.install_ios} <strong>⬆</strong> {jt.install_ios2}</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground num-mono tracking-widest">{jt.redirect(countdown)}</p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>{langBtn}</div>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-primary/10 rounded-[22px] flex items-center justify-center text-primary">
              <Star size={40} fill="currentColor" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">{jt.loyalty_points}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {step === 'phone'    && jt.receive_pts(pts, restaurantName)}
              {step === 'password' && jt.enter_password}
              {step === 'register' && jt.create_account}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium text-center">
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handlePhone} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs eyebrow text-muted-foreground ml-1">{jt.phone_label}</Label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={20} />
                  <Input className="pl-12 h-14 text-xl rounded-2xl border-border/60 num-mono bg-card" placeholder="0612345678" type="tel" dir="ltr"
                    value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <>{jt.continue_btn} <ArrowRight className="ml-2 h-6 w-6" /></>}
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePassword} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs eyebrow text-muted-foreground ml-1">{jt.password_label}</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={20} />
                  <Input type="password" className="pl-12 h-14 text-xl rounded-2xl border-border/60 bg-card" placeholder="••••••••" dir="ltr"
                    value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} autoFocus />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <>{jt.validate_btn} <ArrowRight className="ml-2 h-6 w-6" /></>}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('phone'); setError(''); setPassword('') }} disabled={loading}>
                {jt.change_number}
              </Button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs eyebrow text-muted-foreground ml-1">{jt.name_label}</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={20} />
                  <Input className="pl-12 h-14 text-xl rounded-2xl border-border/60 bg-card" placeholder={jt.name_ph}
                    value={name} onChange={e => setName(e.target.value)} required disabled={loading} autoFocus />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs eyebrow text-muted-foreground ml-1">{jt.password_choose}</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={20} />
                  <Input type="password" className="pl-12 h-14 text-xl rounded-2xl border-border/60 bg-card" placeholder="••••••••" dir="ltr"
                    value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : jt.create_btn}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('phone'); setError(''); setPassword('') }} disabled={loading}>
                {jt.change_number}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
