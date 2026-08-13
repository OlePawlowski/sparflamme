import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { DayTimeline } from '../components/DayTimeline'
import { EventSheet } from '../components/EventSheet'
import { Icon } from '../components/Icon'
import {
  addDays,
  buildDayCurve,
  dateFromKey,
  dayGain,
  dayLoad,
  levelBand,
  nowMinutes,
  startOfWeek,
  todayKey,
} from '../lib/energy'
import type { EnergyEvent } from '../types'

const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const BAND_COLOR = { good: 'var(--green)', mid: 'var(--amber)', low: 'var(--red)' }

export function Week() {
  const { state } = useStore()
  const today = todayKey()
  const [selected, setSelected] = useState(today)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [sheet, setSheet] = useState<{ open: boolean; event?: EnergyEvent } | null>(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const dayEnd = (d: string) => {
    const curve = buildDayCurve(state, d, null)
    return curve.length ? curve[curve.length - 1].level : 100
  }

  const events = state.events.filter((e) => e.date === selected).sort((a, b) => a.start - b.start)
  const load = Math.round(dayLoad(state, selected))
  const gain = Math.round(dayGain(state, selected))
  const end = Math.round(dayEnd(selected))

  return (
    <>
      <div className="appbar">
        <div>
          <h1>Wochenplan</h1>
          <p className="sub">
            {dateFromKey(weekStart).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} –{' '}
            {dateFromKey(addDays(weekStart, 6)).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn icon" aria-label="Vorherige Woche" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <Icon name="arrowLeft" size={16} />
          </button>
          <button className="btn icon" aria-label="Nächste Woche" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>

      <div className="scroll">
        <div className="weekbar">
          {days.map((d, i) => {
            const lvl = dayEnd(d)
            const hasEvents = state.events.some((e) => e.date === d)
            return (
              <button key={d} className={`day ${d === selected ? 'active' : ''}`} onClick={() => setSelected(d)}>
                <div className="dw">{DOW[i]}</div>
                <div className="dd">{dateFromKey(d).getDate()}</div>
                <div
                  className="bar"
                  style={{ background: hasEvents ? BAND_COLOR[levelBand(lvl)] : undefined }}
                />
              </button>
            )
          })}
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="spread">
            <div>
              <p style={{ fontSize: 15, fontWeight: 500 }}>
                {dateFromKey(selected).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="muted">{events.length === 0 ? 'Keine Einträge' : `${events.length} Einträge`}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="tiny">Tagesende</p>
              <p className="num" style={{ fontSize: 22, fontWeight: 600, color: BAND_COLOR[levelBand(end)] }}>{end}%</p>
            </div>
          </div>
          <div className="row" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', gap: 16 }}>
            <span className="delta pos">+{gain}%</span>
            <span className="delta neg">{load}%</span>
            <span className="tiny" style={{ marginLeft: 'auto' }}>
              Aufladen / Verbrauch
            </span>
          </div>
        </div>

        <p className="section-title">Stundenplan</p>
        <DayTimeline
          events={events}
          now={selected === today ? nowMinutes() : undefined}
          onClick={(e) => setSheet({ open: true, event: e })}
        />

        <button className="btn block" style={{ marginTop: 10 }} onClick={() => setSheet({ open: true })}>
          <Icon name="plus" size={16} />
          Eintrag hinzufügen
        </button>
      </div>

      {sheet?.open && <EventSheet date={selected} event={sheet.event} onClose={() => setSheet(null)} />}
    </>
  )
}
