import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { fmtTime } from '../lib/energy'

function toMinutes(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return h * 60 + m
}

/** Untergeordnete Seite: alles, was man selten anfasst. Erreichbar über das Zahnrad. */
export function Settings({ onBack }: { onBack: () => void }) {
  const { state, setProfile, reset } = useStore()
  const p = state.profile

  const permission = 'Notification' in window ? Notification.permission : 'unsupported'
  const blocked = permission === 'denied'

  const requestNotifications = async () => {
    if (p.notificationsEnabled) {
      setProfile({ notificationsEnabled: false })
      return
    }
    if (blocked) return
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
        <div className="row" style={{ gap: 8 }}>
          <button className="btn icon" aria-label="Zurück" onClick={onBack}>
            <Icon name="arrowLeft" size={18} />
          </button>
          <div>
            <h1>Einstellungen</h1>
            <p className="sub">Profil, Schlaf und Benachrichtigungen</p>
          </div>
        </div>
      </div>

      <div className="scroll">
        <p className="section-title">
          <Icon name="user" size={15} />
          Über dich
        </p>
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

        <p className="section-title">
          <Icon name="bed" size={15} />
          Schlafenszeitraum
        </p>
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

        <p className="section-title">
          <Icon name="sun" size={15} />
          Check-in-Anzeige
        </p>
        <div className="card">
          <button
            className="spread"
            style={{ width: '100%' }}
            onClick={() => setProfile({ checkInDisplay: p.checkInDisplay === 'all' ? 'single' : 'all' })}
          >
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>Alle Tageszeiten gleichzeitig zeigen</span>
              <span className="muted">Sonst erscheint nur die nächste offene Tageszeit</span>
            </span>
            <span className={`switch ${p.checkInDisplay === 'all' ? 'on' : ''}`} />
          </button>
        </div>

        <p className="section-title">
          <Icon name="alert" size={15} />
          Benachrichtigungen
        </p>
        <div className="card">
          <button
            className="spread"
            style={{ width: '100%', opacity: blocked ? 0.5 : 1 }}
            onClick={requestNotifications}
            disabled={blocked}
          >
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>Push-Nachrichten</span>
              <span className="muted">Warnung, wenn die Energie knapp wird</span>
            </span>
            <span className={`switch ${p.notificationsEnabled ? 'on' : ''}`} />
          </button>

          {blocked && (
            <p className="tiny" style={{ marginTop: 10, color: 'var(--red)', lineHeight: 1.5 }}>
              Benachrichtigungen wurden im Browser blockiert. Tippe auf das Symbol vor der Adresse (z. B. Schloss-Symbol),
              erlaube Benachrichtigungen für diese Seite und lade sie neu.
            </p>
          )}

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

        <button
          className="btn ghost block"
          style={{ marginTop: 24, color: 'var(--red)' }}
          onClick={() => {
            if (confirm('Alle Daten zurücksetzen?')) {
              reset()
              onBack()
            }
          }}
        >
          Alle Daten zurücksetzen
        </button>
      </div>
    </>
  )
}
