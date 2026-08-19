import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Activity, AppState, CheckIn, EnergyEvent, Profile, WarningLog } from './types'
import { browserBackend, supabaseBackend, type Backend } from './lib/backend'
import { seedState } from './lib/seed'
import { studienModus } from './lib/supabase'
import { useAuth } from './auth'

const id = () => crypto.randomUUID()

interface Store {
  state: AppState
  laedt: boolean
  /** Letzter Speicherfehler, damit die Oberfläche ihn zeigen kann. */
  fehler: string | null
  setProfile: (p: Partial<Profile>) => void
  upsertActivity: (a: Omit<Activity, 'id'> & { id?: string }) => string
  removeActivity: (id: string) => void
  addEvent: (e: Omit<EnergyEvent, 'id'>) => void
  addEventSeries: (e: Omit<EnergyEvent, 'id' | 'seriesId' | 'date'>, dates: string[]) => void
  updateEvent: (id: string, patch: Partial<EnergyEvent>) => void
  removeEvent: (id: string) => void
  removeSeriesFrom: (seriesId: string, fromDate: string) => void
  setCheckIn: (c: Omit<CheckIn, 'id'>) => void
  addWarning: (w: Omit<WarningLog, 'id'>) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { sitzung } = useAuth()
  const [state, setState] = useState<AppState>(seedState)
  const [laedt, setLaedt] = useState(true)
  const [fehler, setFehler] = useState<string | null>(null)
  const zustandRef = useRef(state)
  zustandRef.current = state

  const backend: Backend = useMemo(
    () =>
      studienModus && sitzung
        ? supabaseBackend(sitzung.userId)
        : browserBackend(() => zustandRef.current),
    [sitzung],
  )

  // Schreibvorgänge laufen im Hintergrund; die Oberfläche reagiert sofort.
  const sichern = useRef((arbeit: Promise<void>) => {
    arbeit.catch((e: Error) => setFehler(e.message))
  }).current

  useEffect(() => {
    let abgebrochen = false
    setLaedt(true)
    backend
      .laden()
      .then(async (geladen) => {
        if (abgebrochen) return
        // Beim allerersten Login gibt es noch keine Aktivitäten – Startliste anlegen.
        if (studienModus && geladen.activities.length === 0) {
          const start = seedState().activities.map((a) => ({ ...a, id: id() }))
          geladen = { ...geladen, activities: start }
          for (const a of start) await backend.aktivitaetSpeichern(a)
        }
        setState(geladen)
        setLaedt(false)
      })
      .catch((e: Error) => {
        if (abgebrochen) return
        setFehler(e.message)
        setLaedt(false)
      })
    return () => {
      abgebrochen = true
    }
  }, [backend])

  const store = useMemo<Store>(
    () => ({
      state,
      laedt,
      fehler,
      setProfile: (p) =>
        setState((s) => {
          const neu = { ...s, profile: { ...s.profile, ...p } }
          sichern(backend.profilSpeichern(neu.profile))
          return neu
        }),
      upsertActivity: (a) => {
        const aid = a.id ?? id()
        setState((s) => {
          const vorhanden = a.id && s.activities.some((x) => x.id === a.id)
          const neu = vorhanden
            ? { ...s, activities: s.activities.map((x) => (x.id === a.id ? ({ ...x, ...a } as Activity) : x)) }
            : { ...s, activities: [...s.activities, { ...a, id: aid } as Activity] }
          sichern(backend.aktivitaetSpeichern(neu.activities.find((x) => x.id === aid)!))
          return neu
        })
        return aid
      },
      removeActivity: (aid) =>
        setState((s) => {
          sichern(backend.aktivitaetLoeschen(aid))
          return {
            ...s,
            activities: s.activities.filter((x) => x.id !== aid),
            events: s.events.filter((e) => e.activityId !== aid),
          }
        }),
      addEvent: (e) =>
        setState((s) => {
          const neu = { ...e, id: id() }
          sichern(backend.termineSpeichern([neu]))
          return { ...s, events: [...s.events, neu] }
        }),
      addEventSeries: (e, dates) =>
        setState((s) => {
          const seriesId = id()
          const erzeugt = dates.map((date) => ({ ...e, date, id: id(), seriesId }))
          sichern(backend.termineSpeichern(erzeugt))
          return { ...s, events: [...s.events, ...erzeugt] }
        }),
      updateEvent: (eid, patch) =>
        setState((s) => {
          const events = s.events.map((e) => (e.id === eid ? { ...e, ...patch } : e))
          sichern(backend.termineSpeichern(events.filter((e) => e.id === eid)))
          return { ...s, events }
        }),
      removeEvent: (eid) =>
        setState((s) => {
          sichern(backend.termineLoeschen([eid]))
          return { ...s, events: s.events.filter((e) => e.id !== eid) }
        }),
      removeSeriesFrom: (seriesId, fromDate) =>
        setState((s) => {
          const betroffen = s.events.filter((e) => e.seriesId === seriesId && e.date >= fromDate)
          sichern(backend.termineLoeschen(betroffen.map((e) => e.id)))
          return { ...s, events: s.events.filter((e) => !betroffen.includes(e)) }
        }),
      setCheckIn: (c) =>
        setState((s) => {
          const vorhanden = s.checkIns.find((x) => x.date === c.date && x.slot === c.slot)
          const eintrag: CheckIn = vorhanden ? { ...vorhanden, ...c } : { ...c, id: id() }
          sichern(backend.checkInSpeichern(eintrag))
          return {
            ...s,
            checkIns: vorhanden
              ? s.checkIns.map((x) => (x.id === vorhanden.id ? eintrag : x))
              : [...s.checkIns, eintrag],
          }
        }),
      addWarning: (w) =>
        setState((s) => {
          const neu = { ...w, id: id() }
          sichern(backend.warnungSpeichern(neu))
          return { ...s, warnings: [neu, ...s.warnings].slice(0, 200) }
        }),
      reset: () => {
        sichern(backend.alleDatenLoeschen())
        const frisch = seedState()
        const mitIds = { ...frisch, activities: frisch.activities.map((a) => ({ ...a, id: id() })) }
        setState(mitIds)
        if (studienModus) for (const a of mitIds.activities) sichern(backend.aktivitaetSpeichern(a))
      },
    }),
    [state, laedt, fehler, backend, sichern],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore außerhalb des StoreProvider')
  return c
}
