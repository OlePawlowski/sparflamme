import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Activity, AppState, CheckIn, EnergyEvent, Profile, WarningLog } from './types'
import { demoState, seedState } from './lib/seed'

const KEY = 'sparflamme.v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return demoState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = seedState()
    return {
      profile: { ...base.profile, ...parsed.profile },
      // Ältere Stände speicherten Emojis statt Icon-Namen.
      activities: parsed.activities?.length
        ? parsed.activities.map((a) => ({ ...a, icon: a.icon ?? base.activities.find((b) => b.id === a.id)?.icon ?? 'dot' }))
        : base.activities,
      events: parsed.events ?? [],
      checkIns: parsed.checkIns ?? [],
      warnings: parsed.warnings ?? [],
    }
  } catch {
    return seedState()
  }
}

const id = () => Math.random().toString(36).slice(2, 10)

interface Store {
  state: AppState
  setProfile: (p: Partial<Profile>) => void
  /** Gibt die id der angelegten bzw. aktualisierten Aktivität zurück. */
  upsertActivity: (a: Omit<Activity, 'id'> & { id?: string }) => string
  removeActivity: (id: string) => void
  addEvent: (e: Omit<EnergyEvent, 'id'>) => void
  updateEvent: (id: string, patch: Partial<EnergyEvent>) => void
  removeEvent: (id: string) => void
  setCheckIn: (c: Omit<CheckIn, 'id'>) => void
  addWarning: (w: Omit<WarningLog, 'id'>) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const store = useMemo<Store>(
    () => ({
      state,
      setProfile: (p) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      upsertActivity: (a) => {
        const aid = a.id ?? id()
        setState((s) => {
          if (a.id && s.activities.some((x) => x.id === a.id)) {
            return { ...s, activities: s.activities.map((x) => (x.id === a.id ? ({ ...x, ...a } as Activity) : x)) }
          }
          return { ...s, activities: [...s.activities, { ...a, id: aid } as Activity] }
        })
        return aid
      },
      removeActivity: (aid) =>
        setState((s) => ({
          ...s,
          activities: s.activities.filter((x) => x.id !== aid),
          events: s.events.filter((e) => e.activityId !== aid),
        })),
      addEvent: (e) => setState((s) => ({ ...s, events: [...s.events, { ...e, id: id() }] })),
      updateEvent: (eid, patch) =>
        setState((s) => ({ ...s, events: s.events.map((e) => (e.id === eid ? { ...e, ...patch } : e)) })),
      removeEvent: (eid) => setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== eid) })),
      setCheckIn: (c) =>
        setState((s) => {
          const existing = s.checkIns.find((x) => x.date === c.date && x.slot === c.slot)
          if (existing) {
            return { ...s, checkIns: s.checkIns.map((x) => (x.id === existing.id ? { ...x, ...c } : x)) }
          }
          return { ...s, checkIns: [...s.checkIns, { ...c, id: id() }] }
        }),
      addWarning: (w) => setState((s) => ({ ...s, warnings: [{ ...w, id: id() }, ...s.warnings].slice(0, 100) })),
      reset: () => setState(seedState()),
    }),
    [state],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore außerhalb des StoreProvider')
  return c
}
