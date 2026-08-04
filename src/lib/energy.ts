import type { Activity, AppState, CheckIn, EnergyEvent, Slot } from '../types'

export const STEP = 15

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morgens',
  noon: 'Mittags',
  evening: 'Abends',
}

export function slotTime(slot: Slot, sleepEnd: number): number {
  if (slot === 'morning') return sleepEnd
  if (slot === 'noon') return 13 * 60
  return 20 * 60
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, delta: number): string {
  const d = dateFromKey(key)
  d.setDate(d.getDate() + delta)
  return todayKey(d)
}

export function startOfWeek(key: string): string {
  const d = dateFromKey(key)
  const dow = (d.getDay() + 6) % 7
  return addDays(key, -dow)
}

export function fmtTime(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function nowMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

export function levelBand(level: number): 'good' | 'mid' | 'low' {
  if (level >= 50) return 'good'
  if (level >= 25) return 'mid'
  return 'low'
}

export function levelLabel(level: number): string {
  if (level >= 90) return 'sehr gut'
  if (level >= 50) return 'gut'
  if (level >= 25) return 'geht so'
  if (level >= 10) return 'schlecht'
  return 'sehr schlecht'
}

export interface CurvePoint {
  t: number
  level: number
  forecast: boolean
}

export function eventEnd(e: EnergyEvent): number {
  return e.start + e.durationMin
}

export function eventDelta(e: EnergyEvent, activities: Activity[]): number {
  const a = activities.find((x) => x.id === e.activityId)
  if (!a) return 0
  return (a.ratePer30 * e.durationMin) / 30
}

function rateAt(t: number, events: EnergyEvent[], activities: Activity[], idle: number): number {
  let sum = 0
  let hit = false
  for (const e of events) {
    if (t >= e.start && t < eventEnd(e)) {
      const a = activities.find((x) => x.id === e.activityId)
      if (a) {
        sum += a.ratePer30
        hit = true
      }
    }
  }
  return hit ? sum : idle
}

/**
 * Tagesverlauf zwischen Aufstehen und Schlafengehen. Check-ins wirken als
 * Messpunkte und setzen die Kurve auf den tatsächlich gefühlten Wert zurück.
 */
export function buildDayCurve(state: AppState, date: string, now: number | null): CurvePoint[] {
  const { profile, activities } = state
  const events = state.events.filter((e) => e.date === date)
  const checkIns = state.checkIns.filter((c) => c.date === date)

  const from = profile.sleepEnd
  const to = profile.sleepStart > profile.sleepEnd ? profile.sleepStart : 24 * 60

  const anchors = new Map<number, number>()
  for (const c of checkIns) {
    const t = Math.round(slotTime(c.slot, profile.sleepEnd) / STEP) * STEP
    anchors.set(t, c.level)
  }

  const morning = checkIns.find((c) => c.slot === 'morning')
  let level = morning ? morning.level : 100

  const points: CurvePoint[] = []
  for (let t = from; t <= to; t += STEP) {
    if (anchors.has(t)) level = anchors.get(t)!
    points.push({ t, level: clamp(level), forecast: now !== null && t > now })
    const rate = rateAt(t, events, activities, profile.idleRatePer30)
    level = clamp(level + (rate * STEP) / 30)
  }
  return points
}

export function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10))
}

export function levelAt(curve: CurvePoint[], t: number): number {
  if (!curve.length) return 100
  if (t <= curve[0].t) return curve[0].level
  for (let i = curve.length - 1; i >= 0; i--) if (curve[i].t <= t) return curve[i].level
  return curve[curve.length - 1].level
}

export interface Crossing {
  t: number
  level: number
}

export function firstCrossing(curve: CurvePoint[], after: number, threshold: number): Crossing | null {
  for (const p of curve) {
    if (p.t < after) continue
    if (p.level <= threshold) return { t: p.t, level: p.level }
  }
  return null
}

/** Nächster Termin ab Zeitpunkt t, der Energie zieht – also ein Kandidat zum Verschieben. */
export function nextDrainingEvent(
  events: EnergyEvent[],
  activities: Activity[],
  date: string,
  t: number,
): EnergyEvent | null {
  return (
    events
      .filter((e) => {
        if (e.date !== date || eventEnd(e) <= t) return false
        const a = activities.find((x) => x.id === e.activityId)
        return !!a && a.ratePer30 < 0
      })
      .sort((a, b) => a.start - b.start)[0] ?? null
  )
}

export function dayLoad(state: AppState, date: string): number {
  return state.events
    .filter((e) => e.date === date)
    .reduce((sum, e) => sum + Math.min(0, eventDelta(e, state.activities)), 0)
}

export function dayGain(state: AppState, date: string): number {
  return state.events
    .filter((e) => e.date === date)
    .reduce((sum, e) => sum + Math.max(0, eventDelta(e, state.activities)), 0)
}

export function checkInFor(checkIns: CheckIn[], date: string, slot: Slot): CheckIn | undefined {
  return checkIns.find((c) => c.date === date && c.slot === slot)
}
