'use client'

import AppShell from '@/components/dashboard/AppShell'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Trash2, Search, ChevronLeft, ChevronRight, Database, RefreshCw } from 'lucide-react'

// ─── Table config ─────────────────────────────────────────────────────────────

const TABLES = [
  { key: 'restaurants',         label: 'Restaurants',  icon: '🏪', color: '#5B21B6', cols: ['id','name','phone','mad_per_point','points_expiry_months','created_at'] },
  { key: 'clients',             label: 'Clients',      icon: '👤', color: '#0369A1', cols: ['id','name','phone','points_balance','total_visits','total_spent','last_visit_at','created_at'] },
  { key: 'visits',              label: 'Visites',      icon: '🛒', color: '#065F46', cols: ['id','client_id','amount_paid','points_earned','expires_at','points_expired','created_at'] },
  { key: 'rewards',             label: 'Récompenses',  icon: '🎁', color: '#B45309', cols: ['id','name','description','points_cost','active','created_at'] },
  { key: 'staff',               label: 'Équipe',       icon: '👥', color: '#BE185D', cols: ['id','name','role','created_at'] },
  { key: 'qr_tokens',           label: 'QR Tokens',    icon: '🔲', color: '#374151', cols: ['id','amount','used_at','created_at'] },
  { key: 'redemption_requests', label: 'Demandes',     icon: '📩', color: '#DC2626', cols: ['id','reward_name','reward_points','client_name','status','created_at'] },
]

const DELETABLE = new Set(['clients', 'rewards', 'staff', 'qr_tokens', 'redemption_requests', 'visits'])

// ─── ER Diagram ───────────────────────────────────────────────────────────────

// [cx, cy] = center of node
const NODES: Record<string, [number, number]> = {
  restaurants:          [470, 120],
  clients:              [130, 310],
  visits:               [240, 490],
  rewards:              [790, 310],
  staff:                [790, 120],
  qr_tokens:            [130, 120],
  redemption_requests:  [590, 490],
}

const EDGES: Array<[string, string, string]> = [
  ['clients',             'restaurants', 'restaurant_id'],
  ['visits',              'clients',     'client_id'],
  ['visits',              'restaurants', 'restaurant_id'],
  ['rewards',             'restaurants', 'restaurant_id'],
  ['staff',               'restaurants', 'restaurant_id'],
  ['qr_tokens',           'restaurants', 'restaurant_id'],
  ['redemption_requests', 'clients',     'client_id'],
  ['redemption_requests', 'restaurants', 'restaurant_id'],
  ['redemption_requests', 'rewards',     'reward_id'],
]

const BOX_W = 160
const BOX_H = 38
const COL_H = 20

function tableBox(key: string) {
  const t = TABLES.find(t => t.key === key)!
  return { w: BOX_W, h: BOX_H + t.cols.length * COL_H }
}

function nodeLeft(key: string)   { return NODES[key][0] - BOX_W / 2 }
function nodeTop(key: string)    { return NODES[key][1] - tableBox(key).h / 2 }

function edgePath(from: string, to: string) {
  const [fx, fy] = NODES[from]
  const [tx, ty] = NODES[to]
  const dx = tx - fx, dy = ty - fy
  const cx1 = fx + dx * 0.45
  const cy1 = fy + dy * 0.1
  const cx2 = tx - dx * 0.45
  const cy2 = ty - dy * 0.1
  return `M ${fx} ${fy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`
}

function ERDiagram({ selected, onSelect, counts }: {
  selected: string; onSelect: (k: string) => void; counts: Record<string, number>
}) {
  const [hovered, setHovered] = useState('')

  return (
    <svg viewBox="0 -20 960 580" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(91,33,182,0.4)" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {EDGES.map(([from, to, label]) => {
        const isActive = hovered === from || hovered === to || selected === from || selected === to
        return (
          <g key={`${from}-${to}`}>
            <path
              d={edgePath(from, to)}
              fill="none"
              stroke={isActive ? '#5B21B6' : 'rgba(21,16,31,0.1)'}
              strokeWidth={isActive ? 2 : 1.5}
              strokeDasharray={isActive ? undefined : '4 3'}
              markerEnd="url(#arrow)"
              style={{ transition: 'all .2s' }}
            />
          </g>
        )
      })}

      {/* Nodes */}
      {TABLES.map(t => {
        const x    = nodeLeft(t.key)
        const y    = nodeTop(t.key)
        const { w, h } = tableBox(t.key)
        const isSelected = selected === t.key
        const isHovered  = hovered  === t.key
        const cnt  = counts[t.key] ?? '…'

        return (
          <g key={t.key} style={{ cursor: 'pointer' }}
            onClick={() => onSelect(t.key)}
            onMouseEnter={() => setHovered(t.key)}
            onMouseLeave={() => setHovered('')}
          >
            {/* Shadow */}
            <rect x={x+3} y={y+3} width={w} height={h} rx={10} fill="rgba(0,0,0,.08)" />
            {/* Main box */}
            <rect x={x} y={y} width={w} height={h} rx={10}
              fill="#fff"
              stroke={isSelected ? t.color : isHovered ? `${t.color}66` : 'rgba(21,16,31,.1)'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              filter={isSelected ? 'url(#glow)' : undefined}
              style={{ transition: 'all .15s' }}
            />
            {/* Header */}
            <rect x={x} y={y} width={w} height={BOX_H} rx={10}
              fill={isSelected ? t.color : isHovered ? `${t.color}18` : `${t.color}0e`}
              style={{ transition: 'fill .15s' }}
            />
            <rect x={x} y={y + BOX_H - 6} width={w} height={6}
              fill={isSelected ? t.color : isHovered ? `${t.color}18` : `${t.color}0e`}
            />
            <text x={x + 10} y={y + 24} fontSize={12} fontWeight="700"
              fill={isSelected ? '#fff' : t.color}
              fontFamily="var(--font-sans), sans-serif"
            >{t.icon} {t.label}</text>
            <text x={x + w - 10} y={y + 24} fontSize={11} fontWeight="600"
              fill={isSelected ? 'rgba(255,255,255,.7)' : `${t.color}99`}
              textAnchor="end" fontFamily="var(--font-mono), monospace"
            >{cnt}</text>

            {/* Column rows */}
            {t.cols.map((col, i) => {
              const isPk  = col === 'id'
              const isFk  = col.endsWith('_id') && col !== 'id'
              return (
                <g key={col}>
                  {i % 2 === 1 && (
                    <rect x={x + 1} y={y + BOX_H + i * COL_H} width={w - 2} height={COL_H} fill="rgba(21,16,31,.02)" />
                  )}
                  <text x={x + 10} y={y + BOX_H + i * COL_H + 14}
                    fontSize={10} fill={isPk ? '#B45309' : isFk ? '#0369A1' : '#6B7280'}
                    fontFamily="var(--font-mono), monospace"
                  >
                    {isPk ? '🔑 ' : isFk ? '🔗 ' : '  ·  '}{col}
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

// ─── Table Browser ────────────────────────────────────────────────────────────

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'oui' : 'non'
  if (typeof val === 'string' && val.length > 40) return val.slice(0, 38) + '…'
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return String(val)
}

function TableBrowser({ tableKey, counts, onCountChange }: {
  tableKey: string; counts: Record<string, number>; onCountChange: () => void
}) {
  const t    = TABLES.find(t => t.key === tableKey)!
  const [rows,    setRows]    = useState<any[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(0)
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<any | null>(null)

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
    setDeleting(row.id)
    await fetch(`/api/db?table=${tableKey}&id=${row.id}`, { method: 'DELETE' })
    setDeleting(null)
    setToDelete(null)
    load()
    onCountChange()
  }

  const totalPages = Math.ceil(total / 20)
  const cols = t.cols.filter(c => c !== 'id' || tableKey === 'restaurants').slice(0, 8)

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Rechercher dans ${t.label}…`}
            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 38, border: '1.5px solid rgba(21,16,31,.1)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
          />
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, flexShrink: 0 }}>
          {total.toLocaleString('fr-FR')} enregistrement{total > 1 ? 's' : ''}
        </div>
        <button onClick={() => { load(); onCountChange() }}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid rgba(21,16,31,.1)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 14, border: '1px solid rgba(21,16,31,.08)', overflow: 'hidden', background: '#fff' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: `${t.color}0a` }}>
                {cols.map(c => (
                  <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.color, borderBottom: `1.5px solid ${t.color}22`, whiteSpace: 'nowrap' }}>
                    {c.replace(/_/g, ' ')}
                  </th>
                ))}
                {DELETABLE.has(tableKey) && (
                  <th style={{ padding: '10px 14px', width: 48, borderBottom: `1.5px solid ${t.color}22` }} />
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Chargement…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Aucun résultat</td></tr>
              ) : rows.map((row, i) => (
                <tr key={row.id ?? i} style={{ borderTop: i > 0 ? '1px solid rgba(21,16,31,.05)' : undefined, transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {cols.map(c => (
                    <td key={c} style={{ padding: '10px 14px', color: c === 'id' ? '#9CA3AF' : '#15101F', fontFamily: ['id','points_balance','total_visits','total_spent','amount_paid','points_earned','mad_per_point','reward_points','amount','points_cost'].includes(c) ? 'var(--font-mono), monospace' : 'inherit', whiteSpace: 'nowrap' }}>
                      {c === 'status' ? (
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: row[c] === 'pending' ? '#FFFBEB' : row[c] === 'accepted' ? '#F0FDF4' : '#FEF2F2',
                          color:      row[c] === 'pending' ? '#B45309' : row[c] === 'accepted' ? '#16A34A'  : '#DC2626',
                        }}>{row[c]}</span>
                      ) : c === 'points_expired' ? (
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: row[c] ? '#FEF2F2' : '#F0FDF4', color: row[c] ? '#DC2626' : '#16A34A'
                        }}>{row[c] ? 'expiré' : 'actif'}</span>
                      ) : c === 'active' ? (
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: row[c] ? '#F0FDF4' : '#F5F5F5', color: row[c] ? '#16A34A' : '#9CA3AF'
                        }}>{row[c] ? 'actif' : 'inactif'}</span>
                      ) : c === 'used_at' ? (
                        row[c]
                          ? <span style={{ color: '#9CA3AF' }}>{formatCell(row[c])}</span>
                          : <span style={{ color: '#16A34A', fontWeight: 600, fontSize: 11 }}>● Non utilisé</span>
                      ) : (
                        <span style={{ color: c === 'id' ? '#C4B5FD' : undefined }}>{formatCell(row[c])}</span>
                      )}
                    </td>
                  ))}
                  {DELETABLE.has(tableKey) && (
                    <td style={{ padding: '6px 10px' }}>
                      <button onClick={() => setToDelete(row)} disabled={deleting === row.id}
                        style={{ padding: '6px 8px', borderRadius: 8, background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} />
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid rgba(21,16,31,.1)', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? .4 : 1 }}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ minWidth: 34, height: 34, borderRadius: 8, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  borderColor: page === p ? t.color : 'rgba(21,16,31,.1)',
                  background: page === p ? t.color : '#fff',
                  color: page === p ? '#fff' : '#374151',
                }}>
                {p + 1}
              </button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid rgba(21,16,31,.1)', background: '#fff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? .4 : 1 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {toDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(21,16,31,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 32px 64px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#15101F', marginBottom: 8 }}>Supprimer cette ligne ?</h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Table : <strong>{t.label}</strong></p>
            <p style={{ fontSize: 11, color: '#C4B5FD', fontFamily: 'var(--font-mono), monospace', marginBottom: 28, wordBreak: 'break-all' }}>
              id: {toDelete.id}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setToDelete(null)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(21,16,31,.1)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => confirmDelete(toDelete)} disabled={!!deleting}
                style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#EF4444', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                {deleting ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DatabasePage() {
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

  const activeT = TABLES.find(t => t.key === activeTable)!

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EDE6FB', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={22} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 32, letterSpacing: '-0.02em', color: '#15101F', lineHeight: 1 }}>
              Base de données
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6, fontWeight: 500 }}>
              Visualisation et gestion des données en temps réel
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 32 }}>
          {TABLES.map(t => (
            <button key={t.key} onClick={() => selectTable(t.key)}
              style={{ background: '#fff', borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
                border: `2px solid ${activeTable === t.key ? t.color : 'rgba(21,16,31,.07)'}`,
                boxShadow: activeTable === t.key ? `0 4px 20px ${t.color}22` : '0 2px 8px rgba(21,16,31,.06)',
                transition: 'all .15s'
              }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <p style={{ fontSize: 22, fontWeight: 800, color: t.color, fontFamily: 'var(--font-mono), monospace', marginTop: 8, lineHeight: 1 }}>
                {counts[t.key]?.toLocaleString('fr-FR') ?? '…'}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginTop: 4, letterSpacing: '0.05em' }}>{t.label}</p>
            </button>
          ))}
        </div>

        {/* ER Diagram */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(21,16,31,.08)', padding: '24px', marginBottom: 32, boxShadow: '0 4px 24px -8px rgba(21,16,31,.08)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 16 }}>
            Diagramme entité-association — cliquez sur une table pour l'explorer
          </p>
          <ERDiagram selected={activeTable} onSelect={selectTable} counts={counts} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>🔑</span> Clé primaire
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>🔗</span> Clé étrangère
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', marginLeft: 8 }}>
              <svg width="30" height="12"><path d="M0,6 L28,6" stroke="rgba(91,33,182,.35)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" /></svg>
              Relation FK
            </div>
          </div>
        </div>

        {/* Table Browser */}
        <div ref={browserRef} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(21,16,31,.08)', overflow: 'hidden', boxShadow: '0 4px 24px -8px rgba(21,16,31,.08)' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(21,16,31,.08)', background: '#FAFAFA' }}>
            {TABLES.map(t => (
              <button key={t.key} onClick={() => setActiveTable(t.key)}
                style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                  background: activeTable === t.key ? '#fff' : 'transparent',
                  color: activeTable === t.key ? t.color : '#6B7280',
                  borderBottom: `3px solid ${activeTable === t.key ? t.color : 'transparent'}`,
                  transition: 'all .15s',
                }}>
                {t.icon} {t.label}
                {counts[t.key] !== undefined && (
                  <span style={{ marginLeft: 6, fontSize: 11, fontFamily: 'var(--font-mono), monospace', background: activeTable === t.key ? `${t.color}18` : '#F0EEF8', color: activeTable === t.key ? t.color : '#9CA3AF', padding: '1px 7px', borderRadius: 99 }}>
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Browser content */}
          <div style={{ padding: '20px' }}>
            <TableBrowser key={activeTable} tableKey={activeTable} counts={counts} onCountChange={loadCounts} />
          </div>
        </div>

      </div>
    </AppShell>
  )
}
