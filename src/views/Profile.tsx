import { useState } from 'react'
import { useStore } from '../store'
import { ActivitySheet } from '../components/ActivitySheet'
import { Icon, type IconName } from '../components/Icon'
import { fmtTime } from '../lib/energy'
import type { Activity, Category } from '../types'

const CATS: { key: Category; label: string; hint: string }[] = [
  { key: 'green', label: 'Lädt auf', hint: 'Aktivitäten, die Energie geben' },
  { key: 'orange', label: 'Neutral', hint: 'Aktivitäten ohne Wirkung' },
  { key: 'red', label: 'Zieht Energie', hint: 'Aktivitäten, die Kraft kosten' },
]

function toMinutes(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return h * 60 + m
}

export function Profile() {
  const { state, setProfile, reset } = useStore()
  const p = state.profile
  const [sheet, setSheet] = useState<{ open: boolean; activity?: Activity } | null>(null)

  const requestNotifications = async () => {
    if (p.notificationsEnabled) {
      setProfile({ notificationsEnabled: false })
      return
    }
    if (!('Notification' in window)) {
      setProfile({ notificationsEnabled: true })
      return
    }
    const res = await Notification.requestPermission()
    setProfile({ notificationsEnabled: res === 'granted' })
  }

  return (
    <>
      <div className="appbar">
        <div>
          <h1>Profil</h1>
          <p className="sub">Deine Einstellungen und Aktivitäten</p>
        </div>
      </div>

      <div className="scroll">
        <div className="card">
          <label className="field" style={{ marginTop: 0 }}>
            <span className="lbl">Name</span>
            <input className="input" value={p.name} placeholder="Dein Name" onChange={(e) => setProfile({ name: e.target.value })} />
          </label>
          <div className="grid2">
            <label className="field">
              <span className="lbl">Alter</span>
              <input
                className="input"
                inputMode="numeric"
                value={p.age ?? ''}
                onChange={(e) => setProfile({ age: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })}
              />
            </label>
            <label className="field">
              <span className="lbl">Status</span>
              <select className="input" value={p.status} onChange={(e) => setProfile({ status: e.target.value })}>
                {['Schüler:in', 'Studierend', 'Ausbildung', 'Berufstätig', 'Teilzeit', 'Zuhause', 'Sonstiges'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="section-title">Schlafenszeitraum</p>
        <div className="card">
          <div className="grid2">
            <label className="field" style={{ marginTop: 0 }}>
              <span className="lbl">Zu Bett</span>
              <input
                className="input"
                type="time"
                value={fmtTime(p.sleepStart)}
                onChange={(e) => setProfile({ sleepStart: toMinutes(e.target.value) })}
              />
            </label>
            <label className="field" style={{ marginTop: 0 }}>
              <span className="lbl">Aufstehen</span>
              <input
                className="input"
                type="time"
                value={fmtTime(p.sleepEnd)}
                onChange={(e) => setProfile({ sleepEnd: toMinutes(e.target.value) })}
              />
            </label>
          </div>
        </div>

        <p className="section-title">Benachrichtigungen</p>
        <div className="card">
          <button className="spread" style={{ width: '100%' }} onClick={requestNotifications}>
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>Push-Nachrichten</span>
              <span className="muted">Warnung, wenn die Energie knapp wird</span>
            </span>
            <span className={`switch ${p.notificationsEnabled ? 'on' : ''}`} />
          </button>

          <div className="field">
            <span className="lbl">Warnung ab {p.warnThreshold}%</span>
            <input
              type="range"
              min={10}
              max={60}
              value={p.warnThreshold}
              onChange={(e) => setProfile({ warnThreshold: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <span className="lbl">Abbruch-Hinweis ab {p.stopThreshold}%</span>
            <input
              type="range"
              min={0}
              max={30}
              value={p.stopThreshold}
              onChange={(e) => setProfile({ stopThreshold: Number(e.target.value) })}
            />
          </div>
        </div>

        <p className="section-title">Grundverbrauch</p>
        <div className="card">
          <div className="field" style={{ marginTop: 0 }}>
            <span className="lbl">Alltag ohne Termin: {p.idleRatePer30}% / 30 Min</span>
            <input
              type="range"
              min={-10}
              max={5}
              value={p.idleRatePer30}
              onChange={(e) => setProfile({ idleRatePer30: Number(e.target.value) })}
            />
          </div>
        </div>

        {CATS.map((c) => (
          <div key={c.key}>
            <p className="section-title">
              <span className={`dot ${c.key}`} style={{ display: 'inline-block', marginRight: 7 }} />
              {c.label}
            </p>
            <div className="card">
              <p className="muted" style={{ marginBottom: 6 }}>{c.hint}</p>
              {state.activities
                .filter((a) => a.category === c.key)
                .map((a) => (
                  <button
                    key={a.id}
                    className={`act-row ${a.category}`}
                    onClick={() => setSheet({ open: true, activity: a })}
                  >
                    <span className="ico">
                      <Icon name={a.icon as IconName} size={18} />
                    </span>
                    <span style={{ flex: 1, fontSize: 14 }}>{a.name}</span>
                    <span className={`delta ${a.ratePer30 > 0 ? 'pos' : a.ratePer30 < 0 ? 'neg' : 'zero'}`}>
                      {a.ratePer30 > 0 ? '+' : ''}
                      {a.ratePer30}% / 30 Min
                    </span>
                  </button>
                ))}
              <button className="btn sm block" style={{ marginTop: 12 }} onClick={() => setSheet({ open: true })}>
                <Icon name="plus" size={15} />
                Aktivität hinzufügen
              </button>
            </div>
          </div>
        ))}

        <button
          className="btn ghost block"
          style={{ marginTop: 24, color: 'var(--red)' }}
          onClick={() => {
            if (confirm('Alle Daten zurücksetzen?')) reset()
          }}
        >
          Alle Daten zurücksetzen
        </button>
      </div>

      {sheet?.open && <ActivitySheet activity={sheet.activity} onClose={() => setSheet(null)} />}
    </>
  )
}
