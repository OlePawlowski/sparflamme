import { useState } from 'react'
import { Sheet } from './Sheet'
import { ActivitySheet } from './ActivitySheet'
import { useStore } from '../store'
import { Icon, type IconName } from './Icon'
import { fmtTime } from '../lib/energy'
import type { Category, EnergyEvent } from '../types'

const CAT_LABEL: Record<Category, string> = {
  green: 'Lädt auf',
  orange: 'Neutral',
  red: 'Zieht Energie',
}

const CAT_CLASS: Record<Category, string> = { green: 'green', orange: 'amber', red: 'red' }

const DURATIONS = [30, 60, 90, 120, 180, 240, 360]

function toMinutes(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return h * 60 + m
}

export function EventSheet({ date, event, onClose }: { date: string; event?: EnergyEvent; onClose: () => void }) {
  const { state, addEvent, updateEvent, removeEvent } = useStore()
  const [activityId, setActivityId] = useState(event?.activityId ?? '')
  const [cat, setCat] = useState<Category>(state.activities.find((a) => a.id === event?.activityId)?.category ?? 'red')
  const [start, setStart] = useState(fmtTime(event?.start ?? 9 * 60))
  const [duration, setDuration] = useState(event?.durationMin ?? 60)
  const [title, setTitle] = useState(event?.title ?? '')
  const [note, setNote] = useState(event?.note ?? '')
  const [newActivity, setNewActivity] = useState(false)

  const activity = state.activities.find((a) => a.id === activityId)
  const delta = activity ? (activity.ratePer30 * duration) / 30 : 0

  const save = () => {
    if (!activity) return
    const payload = {
      date,
      start: toMinutes(start),
      durationMin: duration,
      activityId,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    }
    if (event) updateEvent(event.id, payload)
    else addEvent(payload)
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
                  <Icon name={a.icon as IconName} size={18} />
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
          <span className="lbl">Dauer</span>
          <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d < 60 ? `${d} Min` : `${d / 60} Std`}
              </option>
            ))}
          </select>
        </label>
      </div>

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

      {activity && (
        <div className="card" style={{ marginTop: 18, background: 'var(--surface-2)' }}>
          <div className="spread">
            <span style={{ fontSize: 14 }}>Energiewirkung</span>
            <span className={`delta ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'zero'}`} style={{ fontSize: 19, fontWeight: 600 }}>
              {delta > 0 ? '+' : ''}
              {Math.round(delta)}%
            </span>
          </div>
          <p className="muted" style={{ marginTop: 3 }}>
            {fmtTime(toMinutes(start))} – {fmtTime(toMinutes(start) + duration)}
          </p>
        </div>
      )}

      <button className="btn primary block" style={{ marginTop: 16 }} disabled={!activity} onClick={save}>
        {event ? 'Änderungen speichern' : 'Termin eintragen'}
      </button>

      {event && (
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
