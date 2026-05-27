'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Plus, Trash2, ShieldCheck, LogOut,
  Users, Store, Database, ChevronLeft, ChevronRight,
  Search, RefreshCw, Sun, Moon, Pencil, X,
} from 'lucide-react'

// ─── Theme tokens ─────────────────────────────────────────────────────────────

type Th = ReturnType<typeof makeTheme>

function makeTheme(dark: boolean) {
  const d = dark
  return {
    dark,
    bg:            d ? '#15101F'                 : '#F6F4FF',
    card:          d ? '#2A2236'                 : '#ffffff',
    cardAlt:       d ? '#1E1830'                 : '#ffffff',
    section:       d ? 'rgba(255,255,255,.025)'  : '#ffffff',
    border:        d ? 'rgba(255,255,255,.06)'   : 'rgba(21,16,31,.08)',
    borderMed:     d ? 'rgba(255,255,255,.12)'   : 'rgba(21,16,31,.14)',
    text:          d ? '#ffffff'                 : '#15101F',
    textMuted:     d ? 'rgba(255,255,255,.4)'    : '#6B7280',
    textFaint:     d ? 'rgba(255,255,255,.2)'    : '#9CA3AF',
    accent:        d ? '#A78BFA'                 : '#5B21B6',
    accentSoft:    d ? 'rgba(167,139,250,.15)'   : '#EDE6FB',
    inpBg:         d ? 'rgba(255,255,255,.06)'   : '#ffffff',
    inpBorder:     d ? 'rgba(255,255,255,.1)'    : 'rgba(21,16,31,.12)',
    inpColor:      d ? '#ffffff'                 : '#15101F',
    theadBg:       d ? 'rgba(255,255,255,.04)'   : 'rgba(91,33,182,.04)',
    theadBorder:   d ? 'rgba(255,255,255,.07)'   : 'rgba(21,16,31,.07)',
    rowBorder:     d ? 'rgba(255,255,255,.04)'   : 'rgba(21,16,31,.05)',
    rowHover:      d ? 'rgba(255,255,255,.04)'   : '#F9F8FF',
    idColor:       d ? 'rgba(167,139,250,.45)'   : '#C4B5FD',
    tabBarBg:      d ? 'rgba(0,0,0,.2)'          : '#F9FAFB',
    tabBarBorder:  d ? 'rgba(255,255,255,.06)'   : 'rgba(21,16,31,.07)',
    shadow:        d ? 'rgba(0,0,0,.5)'          : 'rgba(21,16,31,.07)',
    nodeBg:        d ? '#1E1830'                 : '#ffffff',
    nodeBgSel:     d ? '#2A2236'                 : '#F9F8FF',
    nodeStroke:    d ? 'rgba(255,255,255,.07)'   : 'rgba(21,16,31,.1)',
    nodeText:      d ? 'rgba(255,255,255,.85)'   : '#15101F',
    nodeColNorm:   d ? 'rgba(255,255,255,.38)'   : '#9CA3AF',
    nodeColPk:     d ? '#FCD34D'                 : '#B45309',
    nodeColFk:     d ? '#60A5FA'                 : '#2563EB',
    nodeStripe:    d ? 'rgba(255,255,255,.018)'  : 'rgba(21,16,31,.02)',
    edgeInactive:  d ? 'rgba(255,255,255,.08)'   : 'rgba(21,16,31,.12)',
    edgeActive:    d ? '#A78BFA'                 : '#5B21B6',
    modalBg:       d ? '#1E1830'                 : '#ffffff',
    modalBorder:   d ? 'rgba(255,255,255,.08)'   : 'rgba(21,16,31,.08)',
    headerBg:      d ? 'rgba(42,34,54,.85)'      : 'rgba(255,255,255,.9)',
    headerBorder:  d ? 'rgba(255,255,255,.06)'   : 'rgba(21,16,31,.08)',
    tabStripBg:    d ? 'rgba(42,34,54,.5)'       : '#ffffff',
    formInputBg:   d ? '#15101F'                 : '#F9F8FF',
    formInputBorder: d ? 'rgba(255,255,255,.06)' : 'rgba(21,16,31,.1)',
    diagramBg:     d ? 'rgba(255,255,255,.02)'   : '#ffffff',
    statsCardBg:   d ? 'rgba(255,255,255,.04)'   : '#ffffff',
    statsLabel:    d ? 'rgba(255,255,255,.35)'   : '#6B7280',
  }
}

// ─── DB table config ──────────────────────────────────────────────────────────

const DB_TABLES = [
  { key: 'restaurants',         label: 'Restaurants',  icon: '🏪', dark: '#A78BFA', light: '#7C3AED', cols: ['id','name','phone','mad_per_point','points_expiry_months','created_at'] },
  { key: 'clients',             label: 'Clients',      icon: '👤', dark: '#60A5FA', light: '#1D4ED8', cols: ['id','name','phone','points_balance','total_visits','total_spent','last_visit_at','created_at'] },
  { key: 'visits',              label: 'Visites',      icon: '🛒', dark: '#34D399', light: '#059669', cols: ['id','client_id','amount_paid','points_earned','expires_at','points_expired','created_at'] },
  { key: 'rewards',             label: 'Récompenses',  icon: '🎁', dark: '#FCD34D', light: '#B45309', cols: ['id','name','description','points_cost','active','created_at'] },
  { key: 'staff',               label: 'Équipe',       icon: '👥', dark: '#F9A8D4', light: '#BE185D', cols: ['id','name','role','created_at'] },
  { key: 'qr_tokens',           label: 'QR Tokens',    icon: '🔲', dark: '#94A3B8', light: '#475569', cols: ['id','amount','used_at','created_at'] },
  { key: 'redemption_requests', label: 'Demandes',     icon: '📩', dark: '#FCA5A5', light: '#DC2626', cols: ['id','reward_name','reward_points','client_name','status','created_at'] },
]

const DELETABLE = new Set(['clients', 'rewards', 'staff', 'qr_tokens', 'redemption_requests', 'visits'])

type Restaurant = { id: string; user_id: string; name: string; email: string; clientCount: number; created_at: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tcolor(t: typeof DB_TABLES[number], th: Th) {
  return th.dark ? t.dark : t.light
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'oui' : 'non'
  if (typeof val === 'string' && val.length > 42) return val.slice(0, 40) + '…'
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val))
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return String(val)
}

function statusBadge(status: string, th: Th): React.CSSProperties {
  const m: Record<string, [string, string, string, string]> = {
    pending:  ['rgba(251,191,36,.18)', '#FCD34D', '#FFFBEB', '#B45309'],
    accepted: ['rgba(52,211,153,.18)', '#34D399', '#F0FDF4', '#16A34A'],
    rejected: ['rgba(252,165,165,.18)','#FCA5A5', '#FEF2F2', '#DC2626'],
  }
  const [db, dc, lb, lc] = m[status] ?? m.rejected
  return { padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: th.dark ? db : lb, color: th.dark ? dc : lc }
}

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
  ['clients','restaurants'], ['visits','clients'], ['visits','restaurants'],
  ['rewards','restaurants'], ['staff','restaurants'], ['qr_tokens','restaurants'],
  ['redemption_requests','clients'], ['redemption_requests','restaurants'], ['redemption_requests','rewards'],
]
const BOX_W = 160
const BOX_HDR = 36
const COL_H = 19

function bh(key: string) {
  return BOX_HDR + (DB_TABLES.find(t => t.key === key)?.cols.length ?? 4) * COL_H
}
function ep(from: string, to: string) {
  const [fx, fy] = NODES[from], [tx, ty] = NODES[to]
  const dx = tx - fx, dy = ty - fy
  return `M ${fx} ${fy} C ${fx+dx*.45} ${fy+dy*.1}, ${tx-dx*.45} ${ty-dy*.1}, ${tx} ${ty}`
}

function ERDiagram({ selected, onSelect, counts, th }: {
  selected: string; onSelect: (k: string) => void; counts: Record<string, number>; th: Th
}) {
  const [hovered, setHovered] = useState('')
  const markerId = th.dark ? 'arr-dark' : 'arr-light'

  return (
    <svg viewBox="0 -10 960 570" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={th.edgeActive + '80'} />
        </marker>
      </defs>

      {EDGES.map(([from, to]) => {
        const active = hovered === from || hovered === to || selected === from || selected === to
        return (
          <path key={`${from}-${to}`} d={ep(from, to)} fill="none"
            stroke={active ? th.edgeActive : th.edgeInactive}
            strokeWidth={active ? 2 : 1.5}
            strokeDasharray={active ? undefined : '4 3'}
            markerEnd={`url(#${markerId})`}
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
        const color = tcolor(t, th)

        return (
          <g key={t.key} style={{ cursor: 'pointer' }}
            onClick={() => onSelect(t.key)}
            onMouseEnter={() => setHovered(t.key)}
            onMouseLeave={() => setHovered('')}
          >
            <rect x={x+2} y={y+2} width={BOX_W} height={h} rx={10} fill={th.shadow} />
            <rect x={x} y={y} width={BOX_W} height={h} rx={10}
              fill={isSel ? th.nodeBgSel : th.nodeBg}
              stroke={isSel ? color : isHov ? `${color}66` : th.nodeStroke}
              strokeWidth={isSel ? 2 : 1}
              style={{ transition: 'all .15s' }}
            />
            <rect x={x} y={y} width={BOX_W} height={BOX_HDR} rx={10}
              fill={isSel ? `${color}28` : isHov ? `${color}16` : `${color}0e`}
              style={{ transition: 'fill .15s' }}
            />
            <rect x={x} y={y+BOX_HDR-6} width={BOX_W} height={6}
              fill={isSel ? `${color}28` : isHov ? `${color}16` : `${color}0e`}
            />
            <text x={x+10} y={y+23} fontSize={11} fontWeight="700"
              fill={isSel ? color : th.nodeText} fontFamily="system-ui, sans-serif"
            >{t.icon} {t.label}</text>
            <text x={x+BOX_W-8} y={y+23} fontSize={10} fontWeight="600"
              fill={`${color}88`} textAnchor="end" fontFamily="monospace"
            >{counts[t.key] ?? '…'}</text>

            {t.cols.map((col, i) => {
              const isPk = col === 'id'
              const isFk = col.endsWith('_id') && col !== 'id'
              return (
                <g key={col}>
                  {i % 2 === 0 && (
                    <rect x={x+1} y={y+BOX_HDR+i*COL_H} width={BOX_W-2} height={COL_H} fill={th.nodeStripe} />
                  )}
                  <text x={x+10} y={y+BOX_HDR+i*COL_H+13} fontSize={9.5} fontFamily="monospace"
                    fill={isPk ? th.nodeColPk : isFk ? th.nodeColFk : th.nodeColNorm}
                  >{isPk ? '🔑 ' : isFk ? '🔗 ' : '  · '}{col}</text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Table browser ────────────────────────────────────────────────────────────

function TableBrowser({ tableKey, th, onCountChange }: { tableKey: string; th: Th; onCountChange: () => void }) {
  const t = DB_TABLES.find(t => t.key === tableKey)!
  const color = tcolor(t, th)
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
    setDeleting(false); setToDelete(null)
    load(); onCountChange()
  }

  const totalPages = Math.ceil(total / 20)
  const cols = t.cols.slice(0, 8)

  const inp: React.CSSProperties = {
    background: th.inpBg, border: `1px solid ${th.inpBorder}`,
    color: th.inpColor, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }
  const MONO_COLS = new Set(['id','points_balance','total_visits','total_spent','amount_paid','points_earned','mad_per_point','reward_points','amount','points_cost'])

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: th.textFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Rechercher dans ${t.label}…`}
            style={{ ...inp, width: '100%', paddingLeft: 34, paddingRight: 12, height: 38 }}
          />
        </div>
        <span style={{ fontSize: 12, color: th.textFaint, fontWeight: 600, flexShrink: 0 }}>
          {total.toLocaleString('fr-FR')} ligne{total > 1 ? 's' : ''}
        </span>
        <button onClick={() => { load(); onCountChange() }}
          style={{ ...inp, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} color={th.textFaint} />
        </button>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 14, border: `1px solid ${th.theadBorder}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: th.theadBg }}>
                {cols.map(c => (
                  <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, borderBottom: `1px solid ${th.theadBorder}`, whiteSpace: 'nowrap' }}>
                    {c.replace(/_/g, ' ')}
                  </th>
                ))}
                {DELETABLE.has(tableKey) && <th style={{ padding: '10px 14px', width: 44, borderBottom: `1px solid ${th.theadBorder}` }} />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: '48px 0', textAlign: 'center', color: th.textFaint, fontSize: 13 }}>
                  <Loader2 size={18} style={{ display: 'inline', animation: 'spin .8s linear infinite' }} />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={cols.length + 1} style={{ padding: '48px 0', textAlign: 'center', color: th.textFaint, fontSize: 13 }}>Aucun résultat</td></tr>
              ) : rows.map((row, i) => (
                <tr key={row.id ?? i}
                  style={{ borderTop: i > 0 ? `1px solid ${th.rowBorder}` : undefined, transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = th.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {cols.map(c => (
                    <td key={c} style={{ padding: '9px 14px', whiteSpace: 'nowrap',
                      color: c === 'id' ? th.idColor : th.text,
                      fontFamily: MONO_COLS.has(c) ? 'monospace' : 'inherit',
                    }}>
                      {c === 'status' ? (
                        <span style={statusBadge(row[c], th)}>{row[c]}</span>
                      ) : c === 'points_expired' ? (
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                          background: row[c] ? (th.dark ? 'rgba(252,165,165,.18)' : '#FEF2F2') : (th.dark ? 'rgba(52,211,153,.18)' : '#F0FDF4'),
                          color:      row[c] ? (th.dark ? '#FCA5A5' : '#DC2626')               : (th.dark ? '#34D399' : '#16A34A'),
                        }}>{row[c] ? 'expiré' : 'actif'}</span>
                      ) : c === 'active' ? (
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                          background: row[c] ? (th.dark ? 'rgba(52,211,153,.18)' : '#F0FDF4') : (th.dark ? 'rgba(255,255,255,.05)' : '#F5F5F5'),
                          color:      row[c] ? (th.dark ? '#34D399' : '#16A34A')               : (th.dark ? 'rgba(255,255,255,.3)' : '#9CA3AF'),
                        }}>{row[c] ? 'actif' : 'inactif'}</span>
                      ) : c === 'used_at' ? (
                        row[c]
                          ? <span style={{ color: th.textMuted }}>{formatCell(row[c])}</span>
                          : <span style={{ color: th.dark ? '#34D399' : '#16A34A', fontSize: 10, fontWeight: 700 }}>● Disponible</span>
                      ) : (
                        formatCell(row[c])
                      )}
                    </td>
                  ))}
                  {DELETABLE.has(tableKey) && (
                    <td style={{ padding: '6px 10px' }}>
                      <button onClick={() => setToDelete(row)}
                        style={{ padding: '6px 8px', borderRadius: 8, background: th.dark ? 'rgba(252,165,165,.1)' : '#FEF2F2', color: th.dark ? '#FCA5A5' : '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
            style={{ ...inp, padding: '6px 10px', cursor: 'pointer', opacity: page === 0 ? .4 : 1 }}>
            <ChevronLeft size={15} color={th.textMuted} />
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = totalPages <= 7 ? i : page < 4 ? i : page > totalPages-5 ? totalPages-7+i : page-3+i
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ minWidth: 32, height: 32, borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  borderColor: page === p ? color : th.inpBorder,
                  background:  page === p ? `${color}22` : 'transparent',
                  color:       page === p ? color : th.textMuted,
                }}>
                {p+1}
              </button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1}
            style={{ ...inp, padding: '6px 10px', cursor: 'pointer', opacity: page >= totalPages-1 ? .4 : 1 }}>
            <ChevronRight size={15} color={th.textMuted} />
          </button>
        </div>
      )}

      {/* Delete modal */}
      {toDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div style={{ background: th.modalBg, border: `1px solid ${th.modalBorder}`, borderRadius: 24, padding: '36px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: `0 32px 64px ${th.shadow}` }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: th.text, marginBottom: 8 }}>Supprimer cette ligne ?</h3>
            <p style={{ fontSize: 12, color: th.textMuted, marginBottom: 8 }}>Table : <strong style={{ color }}>{t.label}</strong></p>
            <p style={{ fontSize: 10, color: th.accent, fontFamily: 'monospace', marginBottom: 28, wordBreak: 'break-all', opacity: .7 }}>
              id: {toDelete.id}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setToDelete(null)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1px solid ${th.borderMed}`, background: 'transparent', fontSize: 15, fontWeight: 700, color: th.textMuted, cursor: 'pointer' }}>
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

function DatabaseTab({ th }: { th: Th }) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 10 }}>
        {DB_TABLES.map(t => {
          const color = tcolor(t, th)
          return (
            <button key={t.key} onClick={() => selectTable(t.key)}
              style={{ background: activeTable === t.key ? `${color}16` : th.statsCardBg,
                borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
                border: `1.5px solid ${activeTable === t.key ? color : th.border}`,
                boxShadow: activeTable === t.key ? `0 4px 20px ${color}22` : 'none',
                transition: 'all .15s',
              }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <p style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'monospace', marginTop: 8, lineHeight: 1 }}>
                {counts[t.key]?.toLocaleString('fr-FR') ?? '…'}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: th.statsLabel, marginTop: 4 }}>{t.label}</p>
            </button>
          )
        })}
      </div>

      {/* ER Diagram */}
      <div style={{ background: th.diagramBg, borderRadius: 20, border: `1px solid ${th.border}`, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: th.accent, marginBottom: 16 }}>
          Diagramme entité-association — cliquez sur une table
        </p>
        <ERDiagram selected={activeTable} onSelect={selectTable} counts={counts} th={th} />
        <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: th.textMuted }}>🔑 Clé primaire</span>
          <span style={{ fontSize: 11, color: th.textMuted }}>🔗 Clé étrangère</span>
        </div>
      </div>

      {/* Table browser */}
      <div ref={browserRef} style={{ background: th.section, borderRadius: 20, border: `1px solid ${th.border}`, overflow: 'hidden' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${th.tabBarBorder}`, background: th.tabBarBg }}>
          {DB_TABLES.map(t => {
            const color = tcolor(t, th)
            return (
              <button key={t.key} onClick={() => setActiveTable(t.key)}
                style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                  background: 'transparent',
                  color: activeTable === t.key ? color : th.textMuted,
                  borderBottom: `2.5px solid ${activeTable === t.key ? color : 'transparent'}`,
                  transition: 'all .15s',
                }}>
                {t.icon} {t.label}
                {counts[t.key] !== undefined && (
                  <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'monospace', background: `${color}18`, color, padding: '1px 6px', borderRadius: 99 }}>
                    {counts[t.key]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div style={{ padding: 20 }}>
          <TableBrowser key={activeTable} tableKey={activeTable} th={th} onCountChange={loadCounts} />
        </div>
      </div>
    </div>
  )
}

// ─── Restaurants tab ──────────────────────────────────────────────────────────

function RestaurantsTab({ th }: { th: Th }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' })

  // Edit modal
  const [editTarget, setEditTarget] = useState<Restaurant | null>(null)
  const [editForm,   setEditForm]   = useState({ email: '', password: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError,  setEditError]  = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/restaurants')
      if (res.status === 401) { window.location.href = '/admin/login'; return }
      setRestaurants(Array.isArray(await res.json()) ? await (await fetch('/api/admin/restaurants')).json() : [])
    } catch { setRestaurants([]) }
    finally   { setLoading(false) }
  }

  useEffect(() => {
    fetch('/api/admin/restaurants').then(r => {
      if (r.status === 401) { window.location.href = '/admin/login'; return Promise.reject() }
      return r.json()
    }).then(d => setRestaurants(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError('')
    const res = await fetch('/api/admin/restaurants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? 'Erreur.'); setSaving(false); return }
    setForm({ name: '', email: '', password: '', address: '' }); setShowForm(false)
    const d = await (await fetch('/api/admin/restaurants')).json()
    setRestaurants(Array.isArray(d) ? d : [])
    setSaving(false)
  }

  async function handleDelete(r: Restaurant) {
    if (!confirm(`Supprimer "${r.name}" ? Action irréversible.`)) return
    setDeleting(r.id)
    await fetch('/api/admin/restaurants', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, userId: r.user_id }) })
    setDeleting(null)
    const d = await (await fetch('/api/admin/restaurants')).json()
    setRestaurants(Array.isArray(d) ? d : [])
  }

  function openEdit(r: Restaurant) {
    setEditTarget(r)
    setEditForm({ email: r.email, password: '' })
    setEditError('')
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    if (!editForm.email && !editForm.password) { setEditError('Remplissez au moins un champ.'); return }
    setEditSaving(true); setEditError('')
    const body: Record<string, string> = { userId: editTarget.user_id }
    if (editForm.email    && editForm.email    !== editTarget.email) body.email    = editForm.email
    if (editForm.password)                                           body.password = editForm.password
    if (Object.keys(body).length === 1) { setEditTarget(null); setEditSaving(false); return }
    const res  = await fetch('/api/admin/restaurants', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error ?? 'Erreur.'); setEditSaving(false); return }
    setEditTarget(null); setEditSaving(false)
    const d = await (await fetch('/api/admin/restaurants')).json()
    setRestaurants(Array.isArray(d) ? d : [])
  }

  const inp: React.CSSProperties = {
    width: '100%', background: th.formInputBg, border: `1px solid ${th.formInputBorder}`,
    color: th.text, borderRadius: 12, padding: '12px 16px', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { icon: <Store size={24} color={th.accent} />, value: restaurants.length, label: 'Restaurants' },
          { icon: <Users size={24} color="#E9A23B"     />, value: restaurants.reduce((s,r) => s+r.clientCount, 0), label: 'Clients total' },
        ].map((s, i) => (
          <div key={i} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: `0 2px 12px ${th.shadow}` }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: i === 0 ? th.accentSoft : 'rgba(233,162,59,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 32, fontWeight: 800, color: th.text, fontFamily: 'monospace', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: th.textMuted, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: th.text }}>Restaurants partenaires</h2>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: th.accent, color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: `0 4px 14px ${th.accent}44` }}>
          <Plus size={16} /> Nouveau restaurant
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: th.card, border: `1px solid ${th.borderMed}`, borderRadius: 24, padding: '28px 32px', boxShadow: `0 8px 32px ${th.shadow}` }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: th.text, marginBottom: 20 }}>Créer un compte restaurant</h3>
          <form onSubmit={handleCreate}>
            {formError && (
              <div style={{ marginBottom: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 600, textAlign: 'center' }}>
                {formError}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              {[
                { key: 'name',     label: 'Nom du restaurant',  placeholder: 'Café Maure',           type: 'text',     required: true },
                { key: 'email',    label: 'Email de connexion', placeholder: 'contact@cafemaure.ma', type: 'email',    required: true },
                { key: 'password', label: 'Mot de passe',       placeholder: '••••••••',             type: 'password', required: true },
                { key: 'address',  label: 'Adresse (optionnel)', placeholder: 'Kasbah, Rabat',       type: 'text',     required: false },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.accent, marginBottom: 8 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} required={f.required}
                    value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inp}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={saving}
                style={{ flex: 1, padding: '14px', borderRadius: 14, background: th.accent, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> Création…</> : 'Créer le compte'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '14px 24px', borderRadius: 14, border: `1px solid ${th.borderMed}`, background: 'transparent', fontSize: 15, fontWeight: 700, color: th.textMuted, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div style={{ background: th.modalBg, border: `1px solid ${th.modalBorder}`, borderRadius: 24, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: `0 32px 64px ${th.shadow}`, position: 'relative' }}>
            <button onClick={() => setEditTarget(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: th.textMuted, padding: 6 }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: th.accentSoft, color: th.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
                {editTarget.name[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 17, color: th.text }}>{editTarget.name}</p>
                <p style={{ fontSize: 12, color: th.textMuted, marginTop: 2 }}>Modifier les identifiants</p>
              </div>
            </div>

            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {editError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                  {editError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.accent, marginBottom: 8 }}>
                  Email
                </label>
                <input
                  type="email" value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.accent, marginBottom: 8 }}>
                  Nouveau mot de passe <span style={{ color: th.textFaint, fontWeight: 400, textTransform: 'none' }}>(laisser vide pour ne pas changer)</span>
                </label>
                <input
                  type="password" value={editForm.password} placeholder="••••••••"
                  onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                  style={inp}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={editSaving}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, background: th.accent, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: editSaving ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {editSaving ? <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> Enregistrement…</> : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditTarget(null)}
                  style={{ padding: '14px 20px', borderRadius: 14, border: `1px solid ${th.borderMed}`, background: 'transparent', fontSize: 15, fontWeight: 700, color: th.textMuted, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: `0 4px 20px ${th.shadow}` }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12, color: th.textFaint }}>
            <Loader2 size={32} color={th.accent} style={{ animation: 'spin .8s linear infinite' }} />
            <p style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600 }}>CHARGEMENT…</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: th.textFaint }}>
            <Store size={56} style={{ margin: '0 auto 16px', opacity: .2, display: 'block', color: th.text }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: th.textMuted }}>Aucun restaurant encore</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: th.theadBg }}>
                  {['Restaurant', 'Clients', 'Inscrit le', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 20px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.accent, textAlign: i === 3 ? 'right' : 'left', borderBottom: `1px solid ${th.theadBorder}` }}>{h}</th>
                  ))}
                  <th style={{ padding: '12px 20px', borderBottom: `1px solid ${th.theadBorder}` }} />
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r, i) => (
                  <tr key={r.id}
                    style={{ borderTop: i > 0 ? `1px solid ${th.rowBorder}` : undefined, transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = th.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: th.accentSoft, color: th.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                          {r.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: th.text }}>{r.name}</p>
                          <p style={{ fontSize: 12, color: th.textMuted, marginTop: 2 }}>{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: th.text }}>{r.clientCount}</span>
                      <span style={{ fontSize: 11, color: th.textMuted, marginLeft: 6 }}>fidèles</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: th.textMuted, fontFamily: 'monospace' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(r)} disabled={deleting === r.id}
                        style={{ padding: '8px 10px', borderRadius: 10, background: th.dark ? 'rgba(252,165,165,.1)' : '#FEF2F2', color: th.dark ? '#FCA5A5' : '#EF4444', border: 'none', cursor: 'pointer' }}>
                        {deleting === r.id ? <Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }} /> : <Trash2 size={16} />}
                      </button>
                    </td>
                    <td style={{ padding: '16px 12px 16px 0' }}>
                      <button onClick={() => openEdit(r)}
                        style={{ padding: '8px 10px', borderRadius: 10, background: th.dark ? 'rgba(167,139,250,.1)' : th.accentSoft, color: th.accent, border: 'none', cursor: 'pointer' }}>
                        <Pencil size={16} />
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

type ActiveTab = 'restaurants' | 'database'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('restaurants')
  const [isDark, setIsDark]       = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('fidele_admin_theme')
    if (saved === 'light') setIsDark(false)
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('fidele_admin_theme', next ? 'dark' : 'light')
  }

  const th = makeTheme(isDark)

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'restaurants', label: 'Restaurants',     icon: <Store    size={16} /> },
    { key: 'database',    label: 'Base de données', icon: <Database size={16} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', background: th.bg, color: th.text, transition: 'background .25s, color .25s' }}>

      {/* Header */}
      <header style={{ background: th.headerBg, backdropFilter: 'saturate(180%) blur(20px)', borderBottom: `1px solid ${th.headerBorder}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(91,33,182,.4)' }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 20, letterSpacing: '-0.02em', color: th.text }}>
              Fid<span style={{ color: '#5B21B6' }}>è</span>le
            </span>
            <span style={{ marginLeft: 12, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textFaint }}>Admin</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${th.border}`, background: th.inpBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}>
            {isDark
              ? <Sun  size={16} color="#FCD34D" />
              : <Moon size={16} color="#5B21B6" />}
          </button>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: th.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, transition: 'color .15s' }}>
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ borderBottom: `1px solid ${th.border}`, background: th.tabStripBg, padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 1100, margin: '0 auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', transition: 'all .15s',
                color: activeTab === t.key ? th.accent : th.textMuted,
                borderBottom: `2.5px solid ${activeTab === t.key ? th.accent : 'transparent'}`,
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'restaurants'
          ? <RestaurantsTab th={th} />
          : <DatabaseTab    th={th} />}
      </div>
    </div>
  )
}
