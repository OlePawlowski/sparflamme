import { useEffect, useRef, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { useAuth } from './auth'
import { studienModus } from './lib/supabase'
import { Login } from './views/Login'
import { Dashboard } from './views/Dashboard'
import { Icon, type IconName } from './components/Icon'
import { Today } from './views/Today'
import { Week } from './views/Week'
import { Curve } from './views/Curve'
import { Profile } from './views/Profile'
import { Settings } from './views/Settings'
import {
  buildDayCurve,
  firstCrossing,
  fmtTime,
  levelAt,
  nextDrainingEvent,
  nowMinutes,
  todayKey,
} from './lib/energy'

type Tab = 'today' | 'week' | 'curve' | 'profile'

const TABS: { key: Tab; icon: IconName; label: string }[] = [
  { key: 'today', icon: 'battery', label: 'Heute' },
  { key: 'week', icon: 'calendar', label: 'Wochenplan' },
  { key: 'curve', icon: 'chart', label: 'Energiekurve' },
  { key: 'profile', icon: 'user', label: 'Profil' },
]

interface Toast {
  id: number
  severity: 'warn' | 'stop' | 'info'
  title: string
  body: string
}

/**
 * Entscheidet, was überhaupt gezeigt wird: Anmeldung, Studien-Dashboard oder
 * die App selbst. Der Store hängt an der Sitzung und wird deshalb erst
 * innerhalb der angemeldeten Ansicht aufgespannt.
 */
export default function App() {
  const { sitzung, laedt } = useAuth()

  if (studienModus && laedt) {
    return (
      <div className="shell">
        <div className="phone" style={{ display: 'grid', placeItems: 'center' }}>
          <p className="muted">Einen Moment…</p>
        </div>
      </div>
    )
  }

  if (studienModus && !sitzung) return <Login />

  // Das Dashboard liest direkt aus der Datenbank und braucht keinen Store –
  // sonst bekaeme das Forscherkonto selbst eine Aktivitaetenliste angelegt.
  if (sitzung?.rolle === 'researcher') return <Dashboard />

  return (
    <StoreProvider>
      <ProbandenApp />
    </StoreProvider>
  )
}

function ProbandenApp() {
  const { state, laedt, fehler } = useStore()
  const [tab, setTab] = useState<Tab>('today')
  const [settingsOffen, setSettingsOffen] = useState(false)
  const [minute, setMinute] = useState(nowMinutes())
  const [toasts, setToasts] = useState<Toast[]>([])
  const fired = useRef<Set<string>>(new Set())

  useEffect(() => {
    const t = setInterval(() => setMinute(nowMinutes()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const push = (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random()
      setToasts((x) => [...x, { ...t, id }])
      setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 10_000)
      if (state.profile.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(t.title, { body: t.body, icon: '/favicon.svg' })
      }
    }

    const date = todayKey()
    const curve = buildDayCurve(state, date, minute)
    if (!curve.length) return
    const level = levelAt(curve, minute)
    const { warnThreshold, stopThreshold } = state.profile
    const bucket = `${date}-${Math.floor(minute / 60)}`

    if (level <= stopThreshold) {
      const key = `stop-${bucket}`
      if (!fired.current.has(key)) {
        fired.current.add(key)
        push({
          severity: 'stop',
          title: 'Brich deine Aktivität ab und ruh dich aus!',
          body: `Dein Energielevel liegt bei ${Math.round(level)}%.`,
        })
      }
      return
    }

    if (level <= warnThreshold) {
      const key = `warn-${bucket}`
      if (!fired.current.has(key)) {
        fired.current.add(key)
        const up = nextDrainingEvent(state.events, state.activities, date, minute)
        const upActivity = up && state.activities.find((a) => a.id === up.activityId)
        push({
          severity: 'warn',
          title: 'Achte auf dein Energielevel',
          body: up
            ? `Nur noch ${Math.round(level)}%. Kannst du „${up.title || upActivity?.name || 'den nächsten Termin'}“ um ${fmtTime(up.start)} verschieben?`
            : `Nur noch ${Math.round(level)}%. Plane jetzt eine Pause ein.`,
        })
      }
      return
    }

    const soon = firstCrossing(curve, minute, warnThreshold)
    if (soon && soon.t - minute <= 120) {
      const key = `ahead-${date}-${soon.t}`
      if (!fired.current.has(key)) {
        fired.current.add(key)
        push({
          severity: 'warn',
          title: 'Achte auf dein Energielevel',
          body: `Bei diesem Plan bist du gegen ${fmtTime(soon.t)} bei ${Math.round(soon.level)}%. Termin verschieben?`,
        })
      }
    }
  }, [state, minute])

  if (laedt) {
    return (
      <div className="shell">
        <div className="phone" style={{ display: 'grid', placeItems: 'center' }}>
          <p className="muted">Deine Daten werden geladen…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <div className="phone">
        {fehler && (
          <div className="speicher-fehler">
            <Icon name="alert" size={15} />
            <span>Nicht gespeichert: {fehler}</span>
          </div>
        )}
        <div className="toasts">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast ${t.severity}`}
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            >
              <span className="t-icon">
                <Icon name="alert" size={17} />
              </span>
              <span>
                <span className="t-title" style={{ display: 'block' }}>
                  {t.title}
                </span>
                <span className="t-body" style={{ display: 'block' }}>
                  {t.body}
                </span>
              </span>
            </div>
          ))}
        </div>

        {settingsOffen ? (
          <Settings onBack={() => setSettingsOffen(false)} />
        ) : (
          <>
            {tab === 'today' && <Today minute={minute} />}
            {tab === 'week' && <Week />}
            {tab === 'curve' && <Curve />}
            {tab === 'profile' && <Profile />}
            <button className="zahnrad" aria-label="Einstellungen" onClick={() => setSettingsOffen(true)}>
              <Icon name="gear" size={21} />
            </button>
          </>
        )}

        <div id="sheet-root" />

        <nav className="nav">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              <Icon name={t.icon} size={20} strokeWidth={tab === t.key ? 1.9 : 1.5} />
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
