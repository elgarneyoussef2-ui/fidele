'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6 text-red-500">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur du dashboard</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Le dashboard a rencontré un problème. Réessayez ou rechargez la page.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-violet-700 text-white rounded-xl font-semibold text-sm hover:bg-violet-800 transition-colors"
      >
        Réessayer
      </button>
    </div>
  )
}
