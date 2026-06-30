'use client'

import { Bell } from 'lucide-react'

export default function InstallBanner({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return (
    <div style={{ margin: '0 16px 0', background: '#EDE6FB', border: '1px solid #C4B5FD', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }} className="fadein">
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bell size={18} color="#fff" aria-hidden />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#3B0764' }}>Installer l'app</p>
        <p style={{ fontSize: 12, color: '#6D28D9', marginTop: 1 }}>Accès rapide depuis l'écran d'accueil</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={onDismiss} style={{ fontSize: 12, color: '#6B7280', padding: '6px 10px', borderRadius: 8, fontWeight: 600 }}>Plus tard</button>
        <button onClick={onInstall} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#5B21B6', padding: '6px 12px', borderRadius: 8 }}>Installer</button>
      </div>
    </div>
  )
}
