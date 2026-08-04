import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Battery } from '../components/Battery'
import { Icon, type IconName } from '../components/Icon'
import { EventRow } from '../components/EventRow'
import { CheckInSheet } from '../components/CheckInSheet'
import { EventSheet } from '../components/EventSheet'
import { SignalSheet } from '../components/SignalSheet'
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
import type { EnergyEvent, Slot } from '../types'

const SLOTS: { key: Slot; icon: IconName }[] = [
  { key: 'morning', icon: 'sunrise' },
  { key: 'noon', icon: 'sun' },
  { key: 'evening', icon: 'moon' },
]

export function Today({ minute }: { minute: number }) {
  const { state, setCheckIn } = useStore()
  const [slotSheet, setSlotSheet] = useState<Slot | null>(null)
  const [eventSheet, setEventSheet] = useState<{ open: boolean; event?: EnergyEvent } | null>(null)
  const [signalSheet, setSignalSheet] = useState(false)

  const date = todayKey()
  const now = minute || nowMinutes()
  const curve = useMemo(() => buildDayCurve(state, date, now), [state, date, now])
  const level = levelAt(curve, now)
  const band = levelBand(level)

  const events = state.events.filter((e) => e.date === date).sort((a, b) => a.start - b.start)
  const endOfDay = curve.length ? curve[curve.length - 1].level : level
  const warnHit = firstCrossing(curve, now, state.profile.warnThreshold)
  const stopHit = firstCrossing(curve, now, state.profile.stopThreshold)

  const forecast = stopHit
    ? { lead: `Gegen ${fmtTime(stopHit.t)} bei ${Math.round(stopHit.level)}%.`, rest: ' Plane eine Pause ein.' }
    : warnHit
      ? { lead: `Gegen ${fmtTime(warnHit.t)} bei ${Math.round(warnHit.level)}%.`, rest: ' Vielleicht etwas verschieben?' }
      : { lead: `Tagesende bei etwa ${Math.round(endOfDay)}%.`, rest: ' Der Tag sieht machbar aus.' }

  const greeting = now < 11 * 60 ? 'Guten Morgen' : now < 17 * 60 ? 'Hallo' : 'Guten Abend'

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
          <div className="hero-top">
            <Battery level={level} size={76} />
            <div>
              <div className="hero-level">{Math.round(level)}%</div>
              <div className="hero-label">Energielevel · {levelLabel(level)}</div>
            </div>
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

        <p className="section-title">Wie geht es dir?</p>
        <div className="slots">
          {SLOTS.map((s) => {
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

        <button className="card" style={{ width: '100%', marginTop: 8, textAlign: 'left' }} onClick={() => setSignalSheet(true)}>
          <div className="row">
            <span style={{ color: 'var(--amber)' }}>
              <Icon name="alert" size={19} />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>Warnsignale erfassen</span>
              <span className="muted">Reizüberflutung früh erkennen</span>
            </span>
            <span style={{ color: 'var(--ink-3)' }}>
              <Icon name="chevron" size={16} />
            </span>
          </div>
        </button>

        <p className="section-title">Heute geplant</p>
        <div className="stack">
          {events.length === 0 && (
            <div className="card empty-state">
              Noch keine Termine für heute.
              <br />
              Trag ein, was ansteht.
            </div>
          )}
          {events.map((e) => (
            <EventRow key={e.id} event={e} now={now} onClick={() => setEventSheet({ open: true, event: e })} />
          ))}
        </div>

        <button className="btn block" style={{ marginTop: 10 }} onClick={() => setEventSheet({ open: true })}>
          <Icon name="plus" size={16} />
          Termin eintragen
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

      {eventSheet?.open && <EventSheet date={date} event={eventSheet.event} onClose={() => setEventSheet(null)} />}

      {signalSheet && <SignalSheet onClose={() => setSignalSheet(false)} />}
    </>
  )
}
