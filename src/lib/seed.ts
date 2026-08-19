import type { Activity, AppState, EnergyEvent, Profile } from '../types'

export const WARNING_SIGNALS_WARN = [
  'Innere Unruhe / Nervosität',
  'Gedankenrasen',
  'Schwere oder tränende Augen',
  'Gähnen',
  'Langsames Sprechen / Stottern',
]

export const WARNING_SIGNALS_STOP = [
  'Augenschmerzen, Blitze in den Augen',
  'Keine Kraft in den Händen, schwere Beine',
  'Herzflimmern, Atemnot',
  'Impulsives Sprechen, Aggressivität, Wut, Zittern',
  'Zusammenhangslos reden / Faden verlieren',
  'Starke motorische Schwierigkeiten (Stolpern, Sachen fallen aus der Hand)',
  'Kopfschmerzen / Migräne, Sekundenschlaf',
]

const defaultActivities: Activity[] = [
  { id: 'a-sleep', name: 'Schlafen', icon: 'bed', category: 'green', ratePer30: 8 },
  { id: 'a-rest', name: 'Ausruhen', icon: 'sofa', category: 'green', ratePer30: 6 },
  { id: 'a-walk', name: 'Spazieren (allein)', icon: 'tree', category: 'green', ratePer30: 4 },
  { id: 'a-tea', name: 'Tee trinken', icon: 'cup', category: 'green', ratePer30: 5 },
  { id: 'a-game', name: 'Zocken', icon: 'gamepad', category: 'green', ratePer30: 3 },
  { id: 'a-book', name: 'Buch lesen', icon: 'book', category: 'green', ratePer30: 4 },
  { id: 'a-trains', name: 'Züge schauen', icon: 'train', category: 'green', ratePer30: 5 },
  { id: 'a-walk-friend', name: 'Spazieren mit Freundin (ruhig)', icon: 'walk', category: 'orange', ratePer30: 0 },
  { id: 'a-eat', name: 'Essen', icon: 'plate', category: 'orange', ratePer30: 0 },
  { id: 'a-school', name: 'Schule', icon: 'school', category: 'red', ratePer30: -5 },
  { id: 'a-friend', name: 'Treffen mit engem Freund', icon: 'user2', category: 'red', ratePer30: -3 },
  { id: 'a-acquaintance', name: 'Treffen mit Bekannten', icon: 'users', category: 'red', ratePer30: -6 },
  { id: 'a-birthday', name: 'Geburtstagsfeier', icon: 'cake', category: 'red', ratePer30: -8 },
  { id: 'a-crowd', name: 'Großveranstaltung (Konzert, Markt)', icon: 'ticket', category: 'red', ratePer30: -12 },
  { id: 'a-errands', name: 'Einkaufen / Besorgungen', icon: 'cart', category: 'red', ratePer30: -6 },
  { id: 'a-doctor', name: 'Arzttermin', icon: 'stethoscope', category: 'red', ratePer30: -8 },
]

const defaultProfile: Profile = {
  name: '',
  age: null,
  status: 'Schüler:in',
  sleepStart: 22 * 60,
  sleepEnd: 7 * 60,
  warnThreshold: 25,
  stopThreshold: 10,
  notificationsEnabled: false,
  checkInDisplay: 'single',
}

export function seedState(): AppState {
  return {
    profile: defaultProfile,
    activities: defaultActivities,
    events: [],
    checkIns: [],
    warnings: [],
  }
}

/** Beispieldaten für den ersten Start, damit Kurve und Wochenplan etwas zeigen. */
export function demoState(): AppState {
  const base = seedState()
  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const ev = (
    date: string,
    start: number,
    durationMin: number,
    activityId: string,
    title?: string,
  ): EnergyEvent => ({ id: `demo-${date}-${start}`, date, start, durationMin, activityId, title })

  const events: EnergyEvent[] = [
    ev(day(-2), 8 * 60, 300, 'a-school', 'Schule'),
    ev(day(-2), 15 * 60, 60, 'a-rest'),
    ev(day(-1), 8 * 60, 300, 'a-school', 'Schule'),
    ev(day(-1), 16 * 60, 120, 'a-birthday', 'Geburtstag bei Lena'),
    ev(day(0), 8 * 60, 300, 'a-school', 'Schule'),
    ev(day(0), 14 * 60, 60, 'a-walk', 'Spaziergang'),
    ev(day(0), 17 * 60, 90, 'a-friend', 'Treffen mit Jonas'),
    ev(day(1), 8 * 60, 300, 'a-school', 'Schule'),
    ev(day(1), 18 * 60, 180, 'a-crowd', 'Weihnachtsmarkt'),
  ]

  return {
    ...base,
    events,
    checkIns: [
      { id: 'demo-c1', date: day(-1), slot: 'morning', level: 78 },
      { id: 'demo-c2', date: day(0), slot: 'morning', level: 85 },
    ],
  }
}
