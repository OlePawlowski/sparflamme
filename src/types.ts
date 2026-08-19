export type Category = 'green' | 'orange' | 'red'

export type Slot = 'morning' | 'noon' | 'evening'

export interface Activity {
  id: string
  name: string
  icon: string
  category: Category
  /** Energieänderung in Prozentpunkten pro 30 Minuten. Positiv = lädt auf. */
  ratePer30: number
}

export interface EnergyEvent {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** Minuten seit Mitternacht */
  start: number
  durationMin: number
  activityId: string
  title?: string
  note?: string
  /** Nachträglich erfasst statt geplant */
  logged?: boolean
  /** Verknüpft wöchentlich wiederkehrende Termine derselben Serie. */
  seriesId?: string
}

export interface CheckIn {
  id: string
  date: string
  slot: Slot
  level: number
  note?: string
}

export interface WarningLog {
  id: string
  /** ISO timestamp */
  at: string
  severity: 'warn' | 'stop'
  signals: string[]
}

export interface Profile {
  name: string
  age: number | null
  status: string
  /** Minuten seit Mitternacht */
  sleepStart: number
  sleepEnd: number
  warnThreshold: number
  stopThreshold: number
  notificationsEnabled: boolean
  /** 'single' zeigt nur die aktuell offene Tageszeit beim Check-in, 'all' immer alle drei. */
  checkInDisplay: 'single' | 'all'
}

export interface AppState {
  profile: Profile
  activities: Activity[]
  events: EnergyEvent[]
  checkIns: CheckIn[]
  warnings: WarningLog[]
}
