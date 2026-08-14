import { useStore } from '../store'
import { Icon, type IconName } from './Icon'
import { eventDelta, eventEnd, fmtTime } from '../lib/energy'
import type { EnergyEvent } from '../types'

const PX_PER_MIN = 1.15

function roundDownHour(min: number) {
  return Math.floor(min / 60) * 60
}
function roundUpHour(min: number) {
  return Math.ceil(min / 60) * 60
}

interface Platzierung {
  event: EnergyEvent
  spalte: number
  spalten: number
}

/**
 * Verteilt sich überschneidende Termine nebeneinander auf Spalten, damit keiner
 * einen anderen verdeckt. Termine werden in Gruppen zusammenhängender
 * Überschneidungen zerlegt; innerhalb einer Gruppe teilen sich alle die Breite.
 */
function platziere(events: EnergyEvent[]): Platzierung[] {
  const sortiert = [...events].sort((a, b) => a.start - b.start || eventEnd(a) - eventEnd(b))
  const ergebnis: Platzierung[] = []
  let gruppe: EnergyEvent[] = []
  let gruppenEnde = -1

  const gruppeAbschließen = () => {
    if (!gruppe.length) return
    // Innerhalb der Gruppe die erste Spalte suchen, die zeitlich frei ist.
    const spaltenEnde: number[] = []
    const zuweisung = gruppe.map((e) => {
      let spalte = spaltenEnde.findIndex((ende) => ende <= e.start)
      if (spalte === -1) {
        spalte = spaltenEnde.length
        spaltenEnde.push(eventEnd(e))
      } else {
        spaltenEnde[spalte] = eventEnd(e)
      }
      return { event: e, spalte }
    })
    for (const z of zuweisung) ergebnis.push({ ...z, spalten: spaltenEnde.length })
    gruppe = []
    gruppenEnde = -1
  }

  for (const e of sortiert) {
    if (gruppe.length && e.start >= gruppenEnde) gruppeAbschließen()
    gruppe.push(e)
    gruppenEnde = Math.max(gruppenEnde, eventEnd(e))
  }
  gruppeAbschließen()

  return ergebnis
}

/** Terminübersicht eines Tages als Stundenplan – Zeilen je Stunde, Termine als Blöcke. */
export function DayTimeline({
  events,
  now,
  onClick,
}: {
  events: EnergyEvent[]
  now?: number
  onClick: (e: EnergyEvent) => void
}) {
  const { state } = useStore()

  if (events.length === 0) {
    return (
      <div className="card empty-state">
        Nichts eingetragen.
        <br />
        Termine planen oder besondere Ereignisse nachtragen.
      </div>
    )
  }

  const earliest = Math.min(...events.map((e) => e.start))
  const latest = Math.max(...events.map((e) => eventEnd(e)))
  const from = Math.max(0, roundDownHour(earliest) - 60)
  const to = Math.min(24 * 60, roundUpHour(latest) + 60)
  const hours = Array.from({ length: Math.round((to - from) / 60) + 1 }, (_, i) => from + i * 60)
  const height = (to - from) * PX_PER_MIN
  const platziert = platziere(events)

  return (
    <div className="timeline card" style={{ height }}>
      {hours.map((h) => (
        <div key={h} className="timeline-hour" style={{ top: (h - from) * PX_PER_MIN }}>
          <span>{fmtTime(h)}</span>
          <div className="timeline-line" />
        </div>
      ))}

      {now !== undefined && now >= from && now <= to && (
        <div className="timeline-now" style={{ top: (now - from) * PX_PER_MIN }} />
      )}

      {platziert.map(({ event: e, spalte, spalten }) => {
        const activity = state.activities.find((a) => a.id === e.activityId)
        const top = (e.start - from) * PX_PER_MIN
        const h = Math.max(30, e.durationMin * PX_PER_MIN)
        const delta = Math.round(eventDelta(e, state.activities))
        const running = now !== undefined && now >= e.start && now < eventEnd(e)
        // 52px Zeitspalte links, 14px Rand rechts – der Rest wird geteilt.
        const spur = `((100% - 66px) / ${spalten})`
        const lücke = spalten > 1 ? 5 : 0
        return (
          <button
            key={e.id}
            className={`timeline-event ${activity?.category ?? ''} ${running ? 'now' : ''} ${spalten > 1 ? 'geteilt' : ''}`}
            style={{
              top,
              height: h,
              left: `calc(52px + ${spalte} * ${spur})`,
              width: `calc(${spur} - ${lücke}px)`,
            }}
            onClick={() => onClick(e)}
          >
            <span className="ico">
              <Icon name={(activity?.icon ?? 'sparkle') as IconName} size={16} />
            </span>
            <span className="timeline-event-body">
              <span className="title">{e.title || activity?.name || 'Termin'}</span>
              <span className="meta">
                {fmtTime(e.start)}–{fmtTime(eventEnd(e))}
              </span>
            </span>
            <span className={`delta ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'zero'}`} style={{ fontSize: 12.5 }}>
              {delta > 0 ? '+' : ''}
              {delta}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
