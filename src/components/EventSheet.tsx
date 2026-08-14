import { useState } from 'react'
import { Sheet } from './Sheet'
import { ActivitySheet } from './ActivitySheet'
import { useStore } from '../store'
import { Icon, type IconName } from './Icon'
import { addDays, fmtTime } from '../lib/energy'
import type { Category, EnergyEvent } from '../types'

const CAT_LABEL: Record<Category, string> = {
  green: 'Lädt auf',
  orange: 'Neutral',
  red: 'Zieht Energie',
}

const CAT_CLASS: Record<Category, string> = { green: 'green', orange: 'amber', red: 'red' }

const REPEAT_WEEKS = [
  { weeks: 4, label: '4 Wochen' },
  { weeks: 8, label: '8 Wochen' },
  { weeks: 12, label: '12 Wochen' },
  { weeks: 26, label: '6 Monate' },
]

/** Minuten seit Mitternacht, oder null bei leerer/ungültiger Eingabe. */
function toMinutes(v: string): number | null {
  const [h, m] = v.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

/** Termine über Mitternacht sind erlaubt, aber nur bis zu dieser Länge – darüber
 *  liegt fast sicher ein Vertipper vor (z. B. 14:00–13:00 ergäbe 23 Stunden). */
const MAX_OVERNIGHT_MIN = 12 * 60

interface Zeitraum {
  duration: number | null
  fehler: string | null
  überMitternacht: boolean
}

function zeitraum(startMin: number | null, endMin: number | null): Zeitraum {
  if (startMin === null || endMin === null) {
    return { duration: null, fehler: 'Bitte Beginn und Ende ausfüllen.', überMitternacht: false }
  }
  if (endMin === startMin) {
    return { duration: null, fehler: 'Ende muss nach dem Beginn liegen.', überMitternacht: false }
  }
  if (endMin > startMin) {
    return { duration: endMin - startMin, fehler: null, überMitternacht: false }
  }
  const übernacht = endMin + 1440 - startMin
  if (übernacht > MAX_OVERNIGHT_MIN) {
    return { duration: null, fehler: 'Ende liegt vor dem Beginn – bitte Zeiten prüfen.', überMitternacht: false }
  }
  return { duration: übernacht, fehler: null, überMitternacht: true }
}

function dauerText(min: number): string {
  const std = Math.floor(min / 60)
  const rest = min % 60
  if (std === 0) return `${rest} Min`
  if (rest === 0) return `${std} Std`
  return `${std} Std ${rest} Min`
}

export function EventSheet({ date, event, onClose }: { date: string; event?: EnergyEvent; onClose: () => void }) {
  const { state, addEvent, addEventSeries, updateEvent, removeEvent, removeSeriesFrom } = useStore()
  const [activityId, setActivityId] = useState(event?.activityId ?? '')
  const [cat, setCat] = useState<Category>(state.activities.find((a) => a.id === event?.activityId)?.category ?? 'red')
  const [start, setStart] = useState(fmtTime(event?.start ?? 9 * 60))
  const [end, setEnd] = useState(fmtTime((event?.start ?? 9 * 60) + (event?.durationMin ?? 60)))
  const [title, setTitle] = useState(event?.title ?? '')
  const [note, setNote] = useState(event?.note ?? '')
  const [newActivity, setNewActivity] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [repeatWeeks, setRepeatWeeks] = useState(8)

  const activity = state.activities.find((a) => a.id === activityId)
  const startMin = toMinutes(start)
  const { duration, fehler, überMitternacht } = zeitraum(startMin, toMinutes(end))
  const delta = activity && duration !== null ? (activity.ratePer30 * duration) / 30 : 0
  const speicherbar = !!activity && duration !== null && startMin !== null

  const save = () => {
    if (!speicherbar) return
    const payload = {
      start: startMin,
      durationMin: duration,
      activityId,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    }
    if (event) {
      updateEvent(event.id, payload)
    } else if (repeat) {
      const dates = Array.from({ length: repeatWeeks }, (_, i) => addDays(date, i * 7))
      addEventSeries(payload, dates)
    } else {
      addEvent({ ...payload, date })
    }
    onClose()
  }

  return (
    <Sheet
      title={event ? 'Termin bearbeiten' : 'Neuer Termin'}
      subtitle="Was steht an – und was macht es mit deiner Energie?"
      onClose={onClose}
    >
      <div className="field">
        <span className="lbl">Art der Aktivität</span>
        <div className="chips">
          {(['green', 'orange', 'red'] as Category[]).map((c) => (
            <button key={c} className={`chip ${CAT_CLASS[c]} ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {CAT_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="lbl">Aktivität</span>
        <div className="card" style={{ padding: '2px 14px', maxHeight: 260, overflowY: 'auto' }}>
          {state.activities
            .filter((a) => a.category === cat)
            .map((a) => (
              <button key={a.id} className={`act-row ${a.category}`} onClick={() => setActivityId(a.id)}>
                <span className="ico">
                  <Icon name={a.icon as IconName} size={20} />
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{a.name}</span>
                <span className={`delta ${a.ratePer30 > 0 ? 'pos' : a.ratePer30 < 0 ? 'neg' : 'zero'}`}>
                  {a.ratePer30 > 0 ? '+' : ''}
                  {a.ratePer30}%
                </span>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    flex: 'none',
                    border: `1px solid ${activityId === a.id ? 'var(--ink)' : 'var(--line-strong)'}`,
                    background: activityId === a.id ? 'var(--ink)' : 'transparent',
                    boxShadow: activityId === a.id ? 'inset 0 0 0 3px #fff' : 'none',
                  }}
                />
              </button>
            ))}
          <button className="act-row" onClick={() => setNewActivity(true)}>
            <span className="ico" style={{ color: 'var(--ink-2)' }}>
              <Icon name="plus" size={18} />
            </span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)' }}>Neue Aktivität anlegen</span>
          </button>
        </div>
      </div>

      <div className="grid2">
        <label className="field">
          <span className="lbl">Beginn</span>
          <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          <span className="lbl">Ende</span>
          <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      {fehler ? (
        <p className="field-error">
          <Icon name="alert" size={14} />
          {fehler}
        </p>
      ) : (
        <p className="tiny" style={{ marginTop: 6 }}>
          Dauer: {dauerText(duration!)}
          {überMitternacht ? ' · geht bis zum nächsten Tag' : ''}
        </p>
      )}

      <label className="field">
        <span className="lbl">Titel (optional)</span>
        <input
          className="input"
          value={title}
          placeholder={activity?.name ?? 'z. B. Mathe-Klausur'}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="lbl">Notiz (optional)</span>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {!event && (
        <div className="field">
          <button className="spread" style={{ width: '100%' }} onClick={() => setRepeat((r) => !r)}>
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>Wiederholt sich wöchentlich</span>
              <span className="muted">Wird automatisch für mehrere Wochen eingetragen</span>
            </span>
            <span className={`switch ${repeat ? 'on' : ''}`} />
          </button>
          {repeat && (
            <div className="chips" style={{ marginTop: 10 }}>
              {REPEAT_WEEKS.map((r) => (
                <button
                  key={r.weeks}
                  className={`chip ${repeatWeeks === r.weeks ? 'active' : ''}`}
                  onClick={() => setRepeatWeeks(r.weeks)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activity && duration !== null && startMin !== null && (
        <div className="card" style={{ marginTop: 18, background: 'var(--surface-2)' }}>
          <div className="spread">
            <span style={{ fontSize: 14 }}>Energiewirkung</span>
            <span className={`delta ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'zero'}`} style={{ fontSize: 19, fontWeight: 600 }}>
              {delta > 0 ? '+' : ''}
              {Math.round(delta)}%
            </span>
          </div>
          <p className="muted" style={{ marginTop: 3 }}>
            {fmtTime(startMin)} – {fmtTime(startMin + duration)}
            {repeat && !event ? ` · ${repeatWeeks}× wöchentlich` : ''}
          </p>
        </div>
      )}

      <button className="btn primary block" style={{ marginTop: 16 }} disabled={!speicherbar} onClick={save}>
        {event ? 'Änderungen speichern' : 'Termin eintragen'}
      </button>

      {event && !event.seriesId && (
        <button
          className="btn ghost block"
          style={{ marginTop: 6, color: 'var(--red)' }}
          onClick={() => {
            removeEvent(event.id)
            onClose()
          }}
        >
          Termin löschen
        </button>
      )}

      {event && event.seriesId && (
        <div className="stack" style={{ marginTop: 6 }}>
          <button
            className="btn ghost block"
            style={{ color: 'var(--red)' }}
            onClick={() => {
              removeEvent(event.id)
              onClose()
            }}
          >
            Nur diesen Termin löschen
          </button>
          <button
            className="btn ghost block"
            style={{ color: 'var(--red)' }}
            onClick={() => {
              removeSeriesFrom(event.seriesId!, event.date)
              onClose()
            }}
          >
            Diesen und alle folgenden löschen
          </button>
        </div>
      )}

      {newActivity && (
        <ActivitySheet
          defaultCategory={cat}
          onSaved={(a) => {
            setCat(a.category)
            setActivityId(a.id)
          }}
          onClose={() => setNewActivity(false)}
        />
      )}
    </Sheet>
  )
}
