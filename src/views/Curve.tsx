import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { AktivitaetsIcon } from '../components/AktivitaetsIcon'
import { Icon } from '../components/Icon'
import {
  addDays,
  buildDayCurve,
  dateFromKey,
  eventDelta,
  fmtTime,
  levelBand,
  nowMinutes,
  todayKey,
} from '../lib/energy'

type Range = 'day' | 'week' | 'month'

const W = 340
const H = 170
const PAD_L = 30
const PAD_B = 28

interface Pt {
  x: number
  y: number
  label: string
  forecast?: boolean
}

interface Warnmarke {
  x: number
  severity: 'warn' | 'stop'
}

function LineChart({
  points,
  markers,
  warnmarken,
}: {
  points: Pt[]
  markers?: { x: number; label: string }[]
  warnmarken?: Warnmarke[]
}) {
  if (points.length < 2) return <div className="empty-state">Noch zu wenig Daten.</div>

  const xs = points.map((p) => p.x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const sx = (x: number) => PAD_L + ((x - minX) / (maxX - minX || 1)) * (W - PAD_L - 8)
  const sy = (y: number) => 8 + (1 - y / 100) * (H - PAD_B - 8)

  const solid = points.filter((p) => !p.forecast)
  const dashed = points.filter((p, i) => p.forecast || (i > 0 && points[i - 1].forecast === false && p.forecast))
  const path = (ps: Pt[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.y)}`).join(' ')
  const forecastPath = (() => {
    const idx = points.findIndex((p) => p.forecast)
    if (idx <= 0) return dashed.length ? path(dashed) : ''
    return path(points.slice(idx - 1))
  })()

  const area = solid.length
    ? `${path(solid)} L${sx(solid[solid.length - 1].x)},${sy(0)} L${sx(solid[0].x)},${sy(0)} Z`
    : ''

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Energieverlauf">
      {/* Drei Baender hinter der Kurve: ueber 50 geht es gut, zwischen 25 und 50
          wird es knapp, darunter ist Schluss. Dieselben Grenzen wie levelBand,
          damit Farbe und Beschriftung dasselbe sagen. */}
      <rect x={PAD_L} y={sy(100)} width={W - PAD_L - 8} height={sy(50) - sy(100)} fill="#3f7a58" opacity="0.07" />
      <rect x={PAD_L} y={sy(50)} width={W - PAD_L - 8} height={sy(25) - sy(50)} fill="#a8762a" opacity="0.08" />
      <rect x={PAD_L} y={sy(25)} width={W - PAD_L - 8} height={sy(0) - sy(25)} fill="#a8443a" opacity="0.09" />

      {[0, 25, 50, 100].map((v) => (
        <g key={v}>
          <line
            x1={PAD_L}
            x2={W - 8}
            y1={sy(v)}
            y2={sy(v)}
            stroke="#e5e2dd"
            strokeWidth="1"
            strokeDasharray={v === 25 ? '3 3' : undefined}
          />
          <text x={6} y={sy(v) + 3.5} fontSize="9" fill="#98938c">
            {v}
          </text>
        </g>
      ))}

      {markers?.map((m, i) => (
        <line key={i} x1={sx(m.x)} x2={sx(m.x)} y1={8} y2={H - PAD_B} stroke="#1e1c1a" strokeWidth="1" opacity="0.07" />
      ))}

      {area && <path d={area} fill="#1e1c1a" opacity="0.05" />}
      {forecastPath && (
        <path d={forecastPath} fill="none" stroke="#98938c" strokeWidth="1.6" strokeDasharray="4 4" strokeLinecap="round" />
      )}
      {solid.length > 1 && (
        <path d={path(solid)} fill="none" stroke="#1e1c1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Warnsignale sitzen auf der Zeitachse, damit sichtbar wird, wann im
          Tagesverlauf sie aufgetreten sind. */}
      {warnmarken?.map((m, i) => (
        <g key={`w${i}`}>
          <line
            x1={sx(m.x)}
            x2={sx(m.x)}
            y1={8}
            y2={H - PAD_B}
            stroke={m.severity === 'stop' ? '#a8443a' : '#a8762a'}
            strokeWidth="1.4"
            strokeDasharray="2 3"
            opacity="0.75"
          />
          <polygon
            points={`${sx(m.x) - 4},${H - PAD_B} ${sx(m.x) + 4},${H - PAD_B} ${sx(m.x)},${H - PAD_B - 6}`}
            fill={m.severity === 'stop' ? '#a8443a' : '#a8762a'}
          />
        </g>
      ))}

      {points
        .filter((_, i) => i % Math.ceil(points.length / 6) === 0)
        .map((p, i) => (
          <text key={i} x={sx(p.x)} y={H - 4} fontSize="12" fontWeight="600" fill="#6a6660" textAnchor="middle">
            {p.label}
          </text>
        ))}
    </svg>
  )
}

export function Curve() {
  const { state } = useStore()
  const [range, setRange] = useState<Range>('day')
  const today = todayKey()
  const now = nowMinutes()

  const points = useMemo<Pt[]>(() => {
    if (range === 'day') {
      return buildDayCurve(state, today, now).map((p) => ({
        x: p.t,
        y: p.level,
        label: fmtTime(p.t),
        forecast: p.forecast,
      }))
    }
    const n = range === 'week' ? 7 : 30
    return Array.from({ length: n }, (_, i) => {
      const d = addDays(today, -(n - 1 - i))
      const curve = buildDayCurve(state, d, null)
      const dd = dateFromKey(d)
      return {
        x: i,
        y: curve.length ? curve[curve.length - 1].level : 100,
        label: range === 'week' ? dd.toLocaleDateString('de-DE', { weekday: 'short' }) : `${dd.getDate()}.`,
      }
    })
  }, [state, range, today, now])

  const markers = useMemo(
    () =>
      range === 'day'
        ? state.events
            .filter((e) => e.date === today)
            .map((e) => ({ x: e.start, label: '' }))
        : [],
    [state.events, range, today],
  )

  /**
   * Warnsignale des gewaehlten Zeitraums, angereichert um die Taetigkeit, die
   * zum Zeitpunkt der Erfassung lief. Die Studienleitung wollte sie in der
   * Kurve mitsehen -- mit Uhrzeit und Taetigkeit, nicht nur als Liste.
   */
  const warnungen = useMemo(() => {
    const vonTag = range === 'day' ? today : addDays(today, -(range === 'week' ? 6 : 29))
    return state.warnings
      .map((w) => {
        const d = new Date(w.at)
        const tag = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const minute = d.getHours() * 60 + d.getMinutes()
        const laufend = state.events.find(
          (e) => e.date === tag && minute >= e.start && minute < e.start + e.durationMin,
        )
        const aktivitaet = laufend ? state.activities.find((a) => a.id === laufend.activityId) : undefined
        return { ...w, tag, minute, taetigkeit: laufend?.title || aktivitaet?.name, icon: aktivitaet?.icon }
      })
      .filter((w) => w.tag >= vonTag && w.tag <= today)
      .sort((a, b) => b.at.localeCompare(a.at))
  }, [state.warnings, state.events, state.activities, range, today])

  /** Nur Tagesansicht hat eine Zeitachse, auf der sich Marken verorten lassen. */
  const warnmarken = useMemo<Warnmarke[]>(
    () =>
      range === 'day'
        ? warnungen.filter((w) => w.tag === today).map((w) => ({ x: w.minute, severity: w.severity }))
        : [],
    [warnungen, range, today],
  )

  const drains = useMemo(() => {
    const from = addDays(today, -29)
    const totals = new Map<string, number>()
    for (const e of state.events) {
      if (e.date < from || e.date > today) continue
      totals.set(e.activityId, (totals.get(e.activityId) ?? 0) + eventDelta(e, state.activities))
    }
    return [...totals.entries()]
      .map(([id, v]) => ({ activity: state.activities.find((a) => a.id === id), total: Math.round(v) }))
      .filter((x) => x.activity)
      .sort((a, b) => a.total - b.total)
  }, [state, today])

  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.y, 0) / points.length) : 0
  const low = points.length ? Math.round(Math.min(...points.map((p) => p.y))) : 0

  return (
    <>
      <div className="appbar">
        <div>
          <h1>Energiekurve</h1>
          <p className="sub">Wie hat sich deine Energie entwickelt?</p>
        </div>
      </div>

      <div className="scroll">
        <div className="chips" style={{ marginBottom: 12 }}>
          {(
            [
              ['day', 'Tag'],
              ['week', 'Woche'],
              ['month', 'Monat'],
            ] as [Range, string][]
          ).map(([k, l]) => (
            <button key={k} className={`chip ${range === k ? 'active' : ''}`} onClick={() => setRange(k)}>
              {l}
            </button>
          ))}
        </div>

        <div className="card">
          <LineChart points={points} markers={markers} warnmarken={warnmarken} />
          <div className="legend" style={{ marginTop: 8, justifyContent: 'center' }}>
            <span>— erfasst</span>
            <span style={{ color: 'var(--ink-3)' }}>--- Prognose</span>
            {warnmarken.length > 0 && <span style={{ color: 'var(--amber)' }}>▲ Warnsignal</span>}
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 8 }}>
          <div className="card">
            <p className="tiny">Durchschnitt</p>
            <p className="num" style={{ fontSize: 24, fontWeight: 600, marginTop: 2 }}>
              {avg}%
            </p>
          </div>
          <div className="card">
            <p className="tiny">Tiefster Punkt</p>
            <p
              className="num"
              style={{
                fontSize: 24,
                fontWeight: 600,
                marginTop: 2,
                color: { good: 'var(--green)', mid: 'var(--amber)', low: 'var(--red)' }[levelBand(low)],
              }}
            >
              {low}%
            </p>
          </div>
        </div>

        <p className="section-title">Was zieht am meisten? (30 Tage)</p>
        <div className="card">
          {drains.length === 0 && <div className="empty-state">Noch keine Einträge.</div>}
          {drains.slice(0, 6).map(({ activity, total }) => (
            <div key={activity!.id} className={`act-row ${activity!.category}`}>
              <span className="ico">
                <AktivitaetsIcon name={activity!.icon} size={20} />
              </span>
              <span style={{ flex: 1, fontSize: 14 }}>{activity!.name}</span>
              <span className={`delta ${total > 0 ? 'pos' : total < 0 ? 'neg' : 'zero'}`}>
                {total > 0 ? '+' : ''}
                {total}%
              </span>
            </div>
          ))}
        </div>

        {warnungen.length > 0 && (
          <>
            <p className="section-title">
              <Icon name="alert" size={15} />
              Warnsignale in diesem Zeitraum
            </p>
            <div className="card">
              {warnungen.slice(0, 8).map((w) => (
                <div key={w.id} className="warn-zeile">
                  <span className={`dot ${w.severity === 'stop' ? 'red' : 'orange'}`} />
                  <span className="warn-text">
                    <span className="warn-signale">{w.signals.join(', ')}</span>
                    <span className="warn-meta">
                      {fmtTime(w.minute)} Uhr
                      {range !== 'day' &&
                        ` · ${dateFromKey(w.tag).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`}
                      {w.taetigkeit ? ` · ${w.taetigkeit}` : ' · keine Tätigkeit eingetragen'}
                    </span>
                  </span>
                  {w.icon && (
                    <span className="ico">
                      <AktivitaetsIcon name={w.icon} size={20} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
