import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { LevelBar } from '../components/LevelBar'
import { Icon, type IconName } from '../components/Icon'
import { CheckInSheet } from '../components/CheckInSheet'
import { EventSheet } from '../components/EventSheet'
import {
  SLOT_LABEL,
  buildDayCurve,
  checkInFor,
  firstCrossing,
  fmtTime,
  levelAt,
  levelBand,
  levelLabel,
  nowMinutes,
  todayKey,
} from '../lib/energy'
import type { Slot } from '../types'

const SLOT_ORDER: { key: Slot; icon: IconName }[] = [
  { key: 'morning', icon: 'sunrise' },
  { key: 'noon', icon: 'sun' },
  { key: 'evening', icon: 'moon' },
]

export function Today({ minute }: { minute: number }) {
  const { state, setCheckIn } = useStore()
  const [slotSheet, setSlotSheet] = useState<Slot | null>(null)
  const [eventSheet, setEventSheet] = useState(false)

  const date = todayKey()
  const now = minute || nowMinutes()
  const curve = useMemo(() => buildDayCurve(state, date, now), [state, date, now])
  const level = levelAt(curve, now)
  const band = levelBand(level)

  const endOfDay = curve.length ? curve[curve.length - 1].level : level
  const warnHit = firstCrossing(curve, now, state.profile.warnThreshold)
  const stopHit = firstCrossing(curve, now, state.profile.stopThreshold)

  const forecast = stopHit
    ? { lead: `Gegen ${fmtTime(stopHit.t)} bei ${Math.round(stopHit.level)}%.`, rest: ' Plane eine Pause ein.' }
    : warnHit
      ? { lead: `Gegen ${fmtTime(warnHit.t)} bei ${Math.round(warnHit.level)}%.`, rest: ' Vielleicht etwas verschieben?' }
      : { lead: `Tagesende bei etwa ${Math.round(endOfDay)}%.`, rest: ' Der Tag sieht machbar aus.' }

  const greeting = now < 11 * 60 ? 'Guten Morgen' : now < 17 * 60 ? 'Hallo' : 'Guten Abend'

  // Im Einzelmodus wird nur die jeweils nächste offene Tageszeit gezeigt –
  // sobald sie erfasst ist, rückt die nächste nach. In "alle anzeigen"
  // bleiben immer alle drei Kacheln sichtbar.
  const showAll = state.profile.checkInDisplay === 'all'
  const openSlot = SLOT_ORDER.find((s) => !checkInFor(state.checkIns, date, s.key))
  const visibleSlots = showAll ? SLOT_ORDER : openSlot ? [openSlot] : []

  return (
    <>
      <div className="appbar">
        <div>
          <h1>
            {greeting}
            {state.profile.name ? `, ${state.profile.name}` : ''}
          </h1>
          <p className="sub">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="scroll">
        <div className={`hero ${band}`}>
          <div className="hero-level">{Math.round(level)}%</div>
          <div className="hero-label">Energielevel · {levelLabel(level)}</div>
          <div style={{ marginTop: 14 }}>
            <LevelBar level={level} width="100%" height={16} />
          </div>
          <div className="hero-note">
            <Icon name={stopHit || warnHit ? 'alert' : 'chart'} size={15} />
            <span>
              <span className="lead" style={{ fontWeight: 500 }}>
                {forecast.lead}
              </span>
              {forecast.rest}
            </span>
          </div>
        </div>

        {!showAll && !openSlot ? (
          <>
            <p className="section-title">Wie geht es dir?</p>
            <div className="card row" style={{ color: 'var(--ink-2)' }}>
              <Icon name="chart" size={17} />
              <span style={{ fontSize: 13.5 }}>Für heute alles erfasst – Morgens, Mittags und Abends.</span>
            </div>
          </>
        ) : (
          visibleSlots.length > 0 && (
            <>
              <p className="section-title">Wie geht es dir?</p>
              <div className="slots">
                {visibleSlots.map((s) => {
                  const c = checkInFor(state.checkIns, date, s.key)
                  return (
                    <button key={s.key} className={`slot ${c ? 'done' : ''}`} onClick={() => setSlotSheet(s.key)}>
                      <Icon name={s.icon} size={19} />
                      <div className="name">{SLOT_LABEL[s.key]}</div>
                      <div className={`val ${c ? '' : 'empty'}`}>{c ? `${c.level}%` : 'eintragen'}</div>
                    </button>
                  )
                })}
              </div>
            </>
          )
        )}

        <button className="btn primary block" style={{ marginTop: showAll || visibleSlots.length ? 10 : 0 }} onClick={() => setEventSheet(true)}>
          <Icon name="plus" size={16} />
          Termin oder Aktivität eintragen
        </button>
      </div>

      {slotSheet && (
        <CheckInSheet
          slot={slotSheet}
          initial={checkInFor(state.checkIns, date, slotSheet)?.level}
          onClose={() => setSlotSheet(null)}
          onSave={(lvl) => {
            setCheckIn({ date, slot: slotSheet, level: lvl })
            setSlotSheet(null)
          }}
        />
      )}

      {eventSheet && <EventSheet date={date} onClose={() => setEventSheet(false)} />}
    </>
  )
}
