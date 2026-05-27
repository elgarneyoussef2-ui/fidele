'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Plus, Trash2, ShieldCheck, LogOut,
  Users, Store, Database, ChevronLeft, ChevronRight,
  Search, RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Restaurant = {
  id: string; user_id: string; name: string; email: string
  clientCount: number; created_at: string
}

// ─── DB table config ──────────────────────────────────────────────────────────

const DB_TABLES = [
  { key: 'restaurants',         label: 'Restaurants',  icon: '🏪', color: '#A78BFA', cols: ['id','name','phone','mad_per_point','points_expiry_months','created_at'] },
  { key: 'clients',             label: 'Clients',      icon: '👤', color: '#60A5FA', cols: ['id','name','phone','points_balance','total_visits','total_spent','last_visit_at','created_at'] },
  { key: 'visits',              label: 'Visites',      icon: '🛒', color: '#34D399', cols: ['id','client_id','amount_paid','points_earned','expires_at','points_expired','created_at'] },
  { key: 'rewards',             label: 'Récompenses',  icon: '🎁', color: '#FCD34D', cols: ['id','name','description','points_cost','active','created_at'] },
  { key: 'staff',               label: 'Équipe',       icon: '👥', color: '#F9A8D4', cols: ['id','name','role','created_at'] },
  { key: 'qr_tokens',           label: 'QR Tokens',    icon: '🔲', color: '#94A3B8', cols: ['id','amount','used_at','created_at'] },
  { key: 'redemption_requests', label: 'Demandes',     icon: '📩', color: '#FCA5A5', cols: ['id','reward_name','reward_points','client_name','status','created_at'] },
]

const DELETABLE = new Set(['clients', 'rewards', 'staff', 'qr_tokens', 'redemption_requests', 'visits'])

// ─── ER Diagram ───────────────────────────────────────────────────────────────

const NODES: Record<string, [number, number]> = {
  restaurants:          [470, 110],
  clients:              [120, 300],
  visits:               [230, 470],
  rewards:              [790, 300],
  staff:                [790, 110],
  qr_tokens:            [120, 110],
  redemption_requests:  [600, 470],
}

const EDGES: Array<[string, string]> = [
  ['clients',             'restaurants'],
  ['visits',              'clients'],
  ['visits',              'restaurants'],
  ['rewards',             'restaurants'],
  ['staff',               'restaurants'],
  ['qr_tokens',           'restaurants'],
  ['redemption_requests', 'clients'],
  ['redemption_requests', 'restaurants'],
  ['redemption_requests', 'rewards'],
]

const BOX_W = 160
const BOX_HDR = 36
const COL_H = 19

function bh(key: string) {
  const t = DB_TABLES.find(t => t.key === key)!
  return BOX_HDR + t.cols.length * COL_H
}

function edgePath(from: string, to: string) {
  const [fx, fy] = NODES[from]
  const [tx, ty] = NODES[to]
  const dx = tx - fx, dy = ty - fy
  return `M ${fx} ${fy} C ${fx + dx * 0.45} ${fy + dy * 0.1}, ${tx - dx * 0.45} ${ty - dy * 0.1}, ${tx} ${ty}`
}

function ERDiagram({ selected, onSelect, counts }: {
  selected: string; onSelect: (k: string) => void; counts: Record<string, number>
}) {
  const [hovered, setHovered] = useState('')

  return (
    <svg viewBox="0 -10 960 570" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="rgba(167,139,250,0.5)" />
        </marker>
      </defs>

      {EDGES.map(([from, to]) => {
        const active = hovered === from || hovered === to || selected === from || selected === to
        return (
          <path key={`${from}-${to}`}
            d={edgePath(from, to)} fill="none"
            stroke={active ? '#A78BFA' : 'rgba(255,255,255,.08)'}
            strokeWidth={active ? 2 : 1.5}
            strokeDasharray={active ? undefined : '4 3'}
            markerEnd="url(#arr)"
            style={{ transition: 'all .2s' }}
          />
        )
      })}

      {DB_TABLES.map(t => {
        const [cx, cy] = NODES[t.key]
        const x = cx - BOX_W / 2
        const y = cy - bh(t.key) / 2
        const h = bh(t.key)
        const isSel = selected === t.key
        const isHov = hovered  === t.key

        return (
          <g key={t.key} style={{ cursor: 'pointer' }}
            onClick={() => onSelect(t.key)}
            onMouseEnter={() => setHovered(t.key)}
            onMouseLeave={() => setHovered('')}
          >
            {/* Shadow */}
            <rect x={x+2} y={y+2} width={BOX_W} height={h} rx={10} fill="rgba(0,0,0,.4)" />
            {/* Box */}
            <rect x={x} y={y} width={BOX_W} height={h} rx={10}
              fill={isSel ? '#2A2236' : '#1E1830'}
              stroke={isSel ? t.color : isHov ? `${t.color}55` : 'rgba(255,255,255,.06)'}
              strokeWidth={isSel ? 2 : 1}
              style={{ transition: 'all .15s' }}
            />
            {/* Header */}
            <rect x={x} y={y} width={BOX_W} height={BOX_HDR} rx={10}
              fill={isSel ? `${t.color}30` : isHov ? `${t.color}18` : `${t.color}10`}
              style={{ transition: 'fill .15s' }}
            />
            <rect x={x} y={y + BOX_HDR - 6} width={BOX_W} height={6}
              fill={isSel ? `${t.color}30` : isHov ? `${t.color}18` : `${t.color}10`}
            />
            {/* Header text */}
            <text x={x + 10} y={y + 23} fontSize={11} fontWeight="700"
              fill={isSel ? t.color : 'rgba(255,255,255,.8)'}
              fontFamily="system-ui, sans-serif"
            >{t.icon} {t.label}</text>
            {/* Count badge */}
            <text x={x + BOX_W - 8} y={y + 23} fontSize={10} fontWeight="600"
              fill={`${t.color}99`} textAnchor="end" fontFamily="monospace"
            >{counts[t.key] ?? '…'}</text>

            {/* Columns */}
            {t.cols.map((col, i) => {
              const isPk = col === 'id'
              const isFk = col.endsWith('_id') && col !== 'id'
              return (
                <g key={col}>
                  {i % 2 === 0 && (
                    <rect x={x + 1} y={y + BOX_HDR + i * COL_H} width={BOX_W - 2} height={COL_H}
                      fill="rgba(255,255,255,.018)" />
                  )}
                  <text x={x + 10} y={y + BOX_HDR + i * COL_H + 13}
                    fontSize={9.5} fontFamily="monospace"
                    fill={isPk ? '#FCD34D' : isFk ? '#60A5FA' : 'rgba(255,255,255,.4)'}
                  >
                    {isPk ? '🔑 ' : isFk ? '🔗 ' : '  · '}{col}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Table browser (dark) ─────────────────────────────────────────────────────

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'oui' : 'non'
  if (typeof val === 'string' && val.length > 42) return val.slice(0, 40) + '…'
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val))
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return String(val)
}

function DarkTableBrowser({ tableKey, onCountChange }: { tableKey: string; onCountChange: () => void }) {
  const t = DB_TABLES.find(t => t.key === tableKey)!
  const [rows,     setRows]     = useState<any[]>([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(0)
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [toDelete, setToDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/db?action=rows&table=${tableKey}&page=${page}&search=${encodeURIComponent(search)}`)
    const data = await res.json()
    setRows(data.rows ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [tableKey, page, search])

  useEffect(() => { setPage(0) }, [tableKey, search])
  useEffect(() => { load() }, [load])

  async function confirmDelete(row: any) {
    setDeleting(true)
    await fetch(`/api/db?table=${tableKey}&id=${row.id}`, { method: 'DELETE' })
    setDeleting(false)
    setToDelete(null)
    load()
    onCountChange()
  }

  const totalPages = Math.ceil(total / 20)
  const cols = t.cols.slice(0, 8)

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
    color: '#fff', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Rechercher dans ${t.label}…`}
            style={{ ...inp, width: '100%', paddingLeft: 34, paddingRight: 12, height: 38 }}
          />
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontWeight: 600, flexShrink: 0 }}>
          {total.toLocaleString('fr-FR')} ligne{total > 1 ? 's' : ''}
        </span>
        <button onClick={() => { load(); onCountChange() }}
          style={{ ...inp, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} color="rgba(255,255,255,.5)" />
        </button>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                {cols.map(c => (
                  <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.color, borderBottom: '1px solid rgba(255,255,255,.06)', whiteSpace: 'nowrap' }}>
                    {c.replace(/_/g, ' ')}
                  </th>
                ))}
                {DELETABLE.has(tableKey) && <th style={{ padding: '10px 14px', width: 44, borderBottom: '1px solid rgba(255,255,255,.06)' }} />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>
                  <Loader2 size={18} style={{ display: 'inline', animation: 'spin .8s linear infinite' }} />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>Aucun résultat</td></tr>
              ) : rows.map((row, i) => (
                <tr key={row.id ?? i}
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,.04)' : undefined, transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {cols.map(c => (
                    <td key={c} style={{
                      padding: '9px 14px', whiteSpace: 'nowrap',
                      color: c === 'id' ? 'rgba(167,139,250,.4)' : 'rgba(255,255,255,.8)',
                      fontFamily: ['id','points_balance','total_visits','total_spent','amount_paid','points_earned','mad_per_point','reward_points','amount','points_cost'].includes(c) ? 'monospace' : 'inherit',
                    }}>
                      {c === 'status' ? (
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                          background: row[c] === 'pending' ? 'rgba(251,191,36,.15)' : row[c] === 'accepted' ? 'rgba(52,211,153,.15)' : 'rgba(252,165,165,.15)',
                          color:      row[c] === 'pending' ? '#FCD34D'             : row[c] === 'accepted' ? '#34D399'             : '#FCA5A5',
                        }}>{row[c]}</span>
                      ) : c === 'points_expired' ? (
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                          background: row[c] ? 'rgba(252,165,165,.15)' : 'rgba(52,211,153,.15)',
                          color:      row[c] ? '#FCA5A5' : '#34D399'
                        }}>{row[c] ? 'expiré' : 'actif'}</span>
                      ) : c === 'active' ? (
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                          background: row[c] ? 'rgba(52,211,153,.15)' : 'rgba(255,255,255,.05)',
                          color:      row[c] ? '#34D399' : 'rgba(255,255,255,.3)'
                        }}>{row[c] ? 'actif' : 'inactif'}</span>
                      ) : c === 'used_at' ? (
                        row[c]
                          ? <span style={{ color: 'rgba(255,255,255,.4)' }}>{formatCell(row[c])}</span>
                          : <span style={{ color: '#34D399', fontSize: 10, fontWeight: 700 }}>● Disponible</span>
                      ) : (
                        formatCell(row[c])
                      )}
                    </td>
                  ))}
                  {DELETABLE.has(tableKey) && (
                    <td style={{ padding: '6px 10px' }}>
                      <button onClick={() => setToDelete(row)}
                        style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(252,165,165,.1)', color: '#FCA5A5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ ...inp, padding: '6px 10px', cursor: 'pointer', opacity: page === 0 ? .4 : 1 }}>
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ minWidth: 32, height: 32, borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  borderColor: page === p ? t.color : 'rgba(255,255,255,.08)',
                  background:  page === p ? `${t.color}22` : 'transparent',
                  color:       page === p ? t.color : 'rgba(255,255,255,.4)',
                }}>
                {p + 1}
              </button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ ...inp, padding: '6px 10px', cursor: 'pointer', opacity: page >= totalPages - 1 ? .4 : 1 }}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Delete modal */}
      {toDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div style={{ background: '#1E1830', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '36px 32px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Supprimer cette ligne ?</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>Table : <strong style={{ color: t.color }}>{t.label}</strong></p>
            <p style={{ fontSize: 10, color: '#A78BFA', fontFamily: 'monospace', marginBottom: 28, wordBreak: 'break-all', opacity: .6 }}>
              id: {toDelete.id}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setToDelete(null)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.6)', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => confirmDelete(toDelete)} disabled={deleting}
                style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#EF4444', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: deleting ? .6 : 1 }}>
                {deleting ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Database tab ─────────────────────────────────────────────────────────────

function DatabaseTab() {
  const [counts,      setCounts]      = useState<Record<string, number>>({})
  const [activeTable, setActiveTable] = useState('clients')
  const browserRef = useRef<HTMLDivElement>(null)

  const loadCounts = useCallback(async () => {
    const res  = await fetch('/api/db?action=stats')
    const data = await res.json()
    setCounts(data)
  }, [])

  useEffect(() => { loadCounts() }, [loadCounts])

  function selectTable(key: string) {
    setActiveTable(key)
    browserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeT = DB_TABLES.find(t => t.key === activeTable)!

  return (
    <div className="space-y-8">

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
        {DB_TABLES.map(t => (
          <button key={t.key} onClick={() => selectTable(t.key)}
            style={{ background: activeTable === t.key ? `${t.color}18` : 'rgba(255,255,255,.03)', borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
              border: `1.5px solid ${activeTable === t.key ? t.color : 'rgba(255,255,255,.06)'}`,
              transition: 'all .15s'
            }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <p style={{ fontSize: 24, fontWeight: 800, color: t.color, fontFamily: 'monospace', marginTop: 8, lineHeight: 1 }}>
              {counts[t.key]?.toLocaleString('fr-FR') ?? '…'}
            </p>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.35)', marginTop: 4, letterSpacing: '0.05em' }}>{t.label}</p>
          </button>
        ))}
      </div>

      {/* ER Diagram */}
      <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,.05)', padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 16 }}>
          Diagramme entité-association — cliquez sur une table
        </p>
        <ERDiagram selected={activeTable} onSelect={selectTable} counts={counts} />
        <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>🔑 Clé primaire</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>🔗 Clé étrangère</span>
        </div>
      </div>

      {/* Table browser */}
      <div ref={browserRef} style={{ background: 'rgba(255,255,255,.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,.05)', overflow: 'hidden' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,.05)', background: 'rgba(0,0,0,.15)' }}>
          {DB_TABLES.map(t => (
            <button key={t.key} onClick={() => setActiveTable(t.key)}
              style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                background: 'transparent',
                color: activeTable === t.key ? t.color : 'rgba(255,255,255,.3)',
                borderBottom: `2.5px solid ${activeTable === t.key ? t.color : 'transparent'}`,
                transition: 'all .15s',
              }}>
              {t.icon} {t.label}
              {counts[t.key] !== undefined && (
                <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'monospace', background: `${t.color}18`, color: t.color, padding: '1px 6px', borderRadius: 99 }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          <DarkTableBrowser key={activeTable} tableKey={activeTable} onCountChange={loadCounts} />
        </div>
      </div>
    </div>
  )
}

// ─── Restaurants tab ──────────────────────────────────────────────────────────

function RestaurantsTab() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/restaurants')
      if (res.status === 401) { window.location.href = '/admin/login'; return }
      const data = await res.json()
      setRestaurants(Array.isArray(data) ? data : [])
    } catch { setRestaurants([]) }
    finally   { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setFormError('')
    const res = await fetch('/api/admin/restaurants', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? 'Erreur.'); setSaving(false); return }
    setForm({ name: '', email: '', password: '', address: '' })
    setShowForm(false)
    load()
    setSaving(false)
  }

  async function handleDelete(r: Restaurant) {
    if (!confirm(`Supprimer "${r.name}" ? Action irréversible.`)) return
    setDeleting(r.id)
    await fetch('/api/admin/restaurants', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, userId: r.user_id }) })
    setDeleting(null)
    load()
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#2A2236] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold num-mono">{restaurants.length}</p>
              <p className="text-xs eyebrow text-fidele-violet-soft mt-1">Restaurants</p>
            </div>
          </div>
        </div>
        <div className="bg-[#2A2236] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-3xl font-bold num-mono">{restaurants.reduce((s, r) => s + r.clientCount, 0)}</p>
              <p className="text-xs eyebrow text-fidele-violet-soft mt-1">Clients total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header + button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Restaurants partenaires</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95">
          <Plus className="h-4 w-4" /> Nouveau restaurant
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-[#2A2236] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-lg font-bold mb-6 text-white">Créer un compte restaurant</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {formError && (
              <div className="sm:col-span-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold px-4 py-3 rounded-xl text-center">{formError}</div>
            )}
            {[
              { key: 'name',     label: 'Nom du restaurant', placeholder: 'Café Maure',             required: true },
              { key: 'email',    label: 'Email de connexion', placeholder: 'contact@cafemaure.ma', required: true,  type: 'email' },
              { key: 'password', label: 'Mot de passe',       placeholder: '••••••••',              required: true,  type: 'password' },
              { key: 'address',  label: 'Adresse (optionnel)', placeholder: 'Kasbah, Rabat',        required: false },
            ].map(f => (
              <div key={f.key} className="space-y-2">
                <label className="text-xs eyebrow text-fidele-violet-soft ml-1">{f.label}</label>
                <input type={f.type ?? 'text'} placeholder={f.placeholder} required={f.required}
                  value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-[#15101F] border border-white/5 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-4 pt-4">
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-4 rounded-xl transition-all disabled:opacity-60 shadow-lg">
                {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Création…</> : 'Créer le compte'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-4 rounded-xl border border-white/10 text-fidele-violet-soft hover:text-white hover:bg-white/5 text-sm font-bold transition-all">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#2A2236] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-fidele-violet-soft">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="eyebrow text-[10px] tracking-[0.2em]">Chargement…</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-24 text-fidele-violet-soft">
            <Store className="h-16 w-16 mx-auto mb-6 opacity-10" />
            <p className="text-lg font-bold text-white/40">Aucun restaurant encore</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft">Restaurant</th>
                  <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft">Clients</th>
                  <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft">Inscrit le</th>
                  <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {restaurants.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {r.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-primary transition-colors">{r.name}</p>
                          <p className="text-xs text-fidele-violet-soft mt-1">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="num-mono font-bold text-lg">{r.clientCount}</span>
                      <span className="text-xs eyebrow text-fidele-violet-soft ml-2">fidèles</span>
                    </td>
                    <td className="px-6 py-5 text-sm text-fidele-violet-soft num-mono">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => handleDelete(r)} disabled={deleting === r.id}
                        className="p-3 text-fidele-violet-soft hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                        {deleting === r.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

type Tab = 'restaurants' | 'database'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('restaurants')

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'restaurants', label: 'Restaurants',    icon: <Store className="h-4 w-4" /> },
    { key: 'database',    label: 'Base de données', icon: <Database className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-[#15101F] text-white">

      {/* Top bar */}
      <header className="bg-[#2A2236]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="wordmark text-xl text-white">Fid<span className="accent">è</span>le</span>
            <span className="eyebrow ml-4 text-[10px] text-fidele-violet-soft tracking-widest">Admin Dashboard</span>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-xs eyebrow text-fidele-violet-soft hover:text-white transition-colors">
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </header>

      {/* Tab bar */}
      <div className="border-b border-white/5 bg-[#2A2236]/40 px-6">
        <div className="flex gap-1 max-w-5xl mx-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all"
              style={{
                color: tab === t.key ? '#A78BFA' : 'rgba(255,255,255,.35)',
                borderBottom: `2px solid ${tab === t.key ? '#A78BFA' : 'transparent'}`,
                background: 'transparent', cursor: 'pointer',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {tab === 'restaurants' ? <RestaurantsTab /> : <DatabaseTab />}
      </div>
    </div>
  )
}
