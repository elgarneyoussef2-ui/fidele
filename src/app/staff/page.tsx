'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, CheckCircle2, LogOut } from 'lucide-react'
import { CSS } from '@/components/staff/styles'
import type { Staff } from '@/components/staff/types'
import LoginScreen from '@/components/staff/LoginScreen'
import QRTab from '@/components/staff/QRTab'
import DemandsTab from '@/components/staff/DemandsTab'
import InstallBanner from '@/components/staff/InstallBanner'

export default function StaffPage() {
  const [staff,         setStaff]         = useState<Staff | null>(null)
  const [tab,           setTab]           = useState<'qr' | 'demands'>('qr')
  const [badge,         setBadge]         = useState(0)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner,    setShowBanner]    = useState(false)
  const prevBadge = useRef(-1)

  // Restore session
  useEffect(() => {
    const s = localStorage.getItem('fidele_staff')
    if (s) { try { setStaff(JSON.parse(s)) } catch {} }
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      const dismissed = sessionStorage.getItem('fidele_install_dismissed')
      if (!dismissed) setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Badge polling every 30s
  useEffect(() => {
    if (!staff) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/redemption?staffId=${staff.id}`, { cache: 'no-store' })
        if (!res.ok) return
        const data  = await res.json()
        const count = Array.isArray(data) ? data.length : 0
        if (count > prevBadge.current && prevBadge.current >= 0) {
          navigator.vibrate?.(200)
        }
        prevBadge.current = count
        setBadge(count)
      } catch {}
    }
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [staff])

  function onLogin(s: Staff) {
    localStorage.setItem('fidele_staff', JSON.stringify(s))
    setStaff(s)
  }

  function logout() {
    localStorage.removeItem('fidele_staff')
    setStaff(null); setBadge(0); prevBadge.current = -1
  }

  function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    installPrompt.userChoice.then(() => { setInstallPrompt(null); setShowBanner(false) })
  }

  function dismissBanner() {
    sessionStorage.setItem('fidele_install_dismissed', '1')
    setShowBanner(false)
  }

  if (!staff) return <><style>{CSS}</style><LoginScreen onLogin={onLogin} /></>

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 700, borderRadius: 14,
    background: active ? '#5B21B6' : 'transparent',
    color: active ? '#fff' : '#6B7280',
    transition: 'all .2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  })

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100dvh', background: '#F5F3FF', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: '#15101F', padding: '14px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg viewBox="0 0 100 100" width="30" height="30" style={{ color: '#A78BFA' }} aria-hidden>
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="11" fill="currentColor" />
            </svg>
            <div>
              <p style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 19, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Fid<span style={{ color: '#C4B5FD' }}>è</span>le
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginTop: 2, letterSpacing: '0.06em' }}>{staff.name}</p>
            </div>
          </div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,.55)', padding: '8px 12px', borderRadius: 10, fontWeight: 600 }}>
            <LogOut size={15} aria-hidden /> Quitter
          </button>
        </div>

        {/* Install banner */}
        {showBanner && <div style={{ paddingTop: 12 }}><InstallBanner onInstall={handleInstall} onDismiss={dismissBanner} /></div>}

        {/* Tab bar */}
        <div style={{ background: '#fff', padding: '10px 12px', display: 'flex', gap: 6, borderBottom: '1px solid rgba(21,16,31,.06)', boxShadow: '0 1px 4px rgba(21,16,31,.04)' }}>
          <button style={tabBtn(tab === 'qr')} onClick={() => setTab('qr')}>
            <QrCode size={16} aria-hidden />
            QR Code
          </button>
          <button style={tabBtn(tab === 'demands')} onClick={() => setTab('demands')}>
            <CheckCircle2 size={16} aria-hidden />
            Demandes
            {badge > 0 && (
              <span
                key={badge}
                className="badgepop"
                style={{ background: '#EF4444', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '2px 6px', lineHeight: 1.3, minWidth: 18, textAlign: 'center' }}
              >
                {badge}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '18px 16px 32px', overflowY: 'auto', maxWidth: 560, width: '100%', margin: '0 auto' }}>
          {tab === 'qr'      && <QRTab staffId={staff.id} />}
          {tab === 'demands' && <DemandsTab staffId={staff.id} onCountChange={n => { prevBadge.current = n; setBadge(n) }} />}
        </div>

      </div>
    </>
  )
}
