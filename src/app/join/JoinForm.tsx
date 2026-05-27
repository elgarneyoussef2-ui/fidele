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
    const showInstall = !isStandalone && (installPrompt || isIOS)

    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{langBtn}</div>

        {/* ── Points card ── */}
        <div style={{ background: '#fff', borderRadius: 28, padding: '32px 24px', boxShadow: '0 4px 24px rgba(21,16,31,.08)', border: '1px solid rgba(21,16,31,.06)', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#16A34A' }}>
            <CheckCircle2 size={44} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#15101F', letterSpacing: '-.02em', marginBottom: 4 }}>
            {jt.bravo(clientName)}
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>{jt.pts_added}</p>

          <div style={{ background: 'linear-gradient(135deg,#EDE6FB,#F3E8FF)', borderRadius: 20, padding: '24px 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6D28D9', marginBottom: 6 }}>{jt.pts_earned}</p>
            <p style={{ fontSize: 64, fontWeight: 900, color: '#5B21B6', lineHeight: 1, fontFamily: 'monospace' }}>+{pointsEarned}</p>
          </div>

          <p style={{ fontSize: 13, color: '#9CA3AF' }}>{jt.new_balance(restaurantName)}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#15101F', fontFamily: 'monospace', marginTop: 4 }}>{jt.points(newBalance)}</p>
        </div>

        {/* ── Install prompt ── */}
        {showInstall && (
          <div style={{
            background: 'linear-gradient(135deg,#15101F 0%,#2D1B69 100%)',
            borderRadius: 24, padding: '24px 22px',
            boxShadow: '0 8px 32px rgba(91,33,182,.35)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              {/* App icon */}
              <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" width="28" height="28" style={{ color: '#A78BFA' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"/>
                  <circle cx="50" cy="50" r="13" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                  {lang === 'ar' ? 'تثبيت تطبيق Fidèle' : 'Installer Fidèle'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                  {lang === 'ar' ? 'وصول سريع من الشاشة الرئيسية' : 'Accès rapide depuis votre écran d\'accueil'}
                </p>
              </div>
            </div>

            {installPrompt ? (
              /* Android — native prompt */
              <button
                type="button"
                onClick={() => { installPrompt.prompt(); installPrompt.userChoice.then(() => setInstallPrompt(null)) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 14,
                  padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(91,33,182,.5)',
                }}
              >
                <Download size={18} />
                {jt.install_btn}
              </button>
            ) : (
              /* iOS — step-by-step */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '①', text: lang === 'ar' ? 'اضغط على زر المشاركة ⬆ في شريط Safari' : 'Appuyez sur ⬆ dans la barre Safari' },
                  { icon: '②', text: lang === 'ar' ? 'اختر « إضافة إلى الشاشة الرئيسية »' : 'Choisissez « Sur l\'écran d\'accueil »' },
                  { icon: '③', text: lang === 'ar' ? 'اضغط « إضافة » للتأكيد' : 'Appuyez sur « Ajouter » pour confirmer' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '10px 14px' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{s.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Wallet button + countdown ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.location.replace('/client')}
            style={{
              width: '100%', padding: '16px', borderRadius: 18, fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg,#6D28D9,#5B21B6)', color: '#fff', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(91,33,182,.35)',
            }}
          >
            {jt.see_wallet}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', letterSpacing: '.1em' }}>
            {jt.redirect(countdown)}
          </p>
        </div>
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
