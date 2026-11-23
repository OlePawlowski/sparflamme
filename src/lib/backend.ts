import type { Activity, AppState, CheckIn, EnergyEvent, Profile, Signal, WarningLog } from '../types'
import { seedState } from './seed'
import { supabase } from './supabase'

/**
 * Ablage der Daten. Zwei Umsetzungen: im Demo-Modus der Browser-Speicher,
 * im Studienmodus die Supabase-Datenbank. Die Views merken davon nichts.
 */
export interface Backend {
  laden(): Promise<AppState>
  profilSpeichern(p: Profile): Promise<void>
  aktivitaetSpeichern(a: Activity): Promise<void>
  aktivitaetLoeschen(id: string): Promise<void>
  termineSpeichern(e: EnergyEvent[]): Promise<void>
  termineLoeschen(ids: string[]): Promise<void>
  checkInSpeichern(c: CheckIn): Promise<void>
  warnungSpeichern(w: WarningLog): Promise<void>
  signalSpeichern(sig: Signal): Promise<void>
  signalLoeschen(id: string): Promise<void>
  alleDatenLoeschen(): Promise<void>
}

/* ------------------------------------------------------------ Demo-Modus -- */

const KEY = 'sparflamme.v1'

/** Schreibt den kompletten Zustand in den Browser-Speicher. */
export function demoSichern(zustand: AppState) {
  localStorage.setItem(KEY, JSON.stringify(zustand))
}

/**
 * Ablage im Browser – nur für Entwicklung und Demo.
 *
 * Die Schreibmethoden tun hier bewusst nichts: sie werden aus dem
 * State-Updater heraus aufgerufen, wo der neue Zustand noch nicht steht. Eine
 * Sicherung von dort heraus hätte den Stand *vor* der Änderung geschrieben und
 * damit jede letzte Aktion beim Neuladen verschluckt. Gesichert wird deshalb
 * im Store, sobald der Zustand tatsächlich steht (siehe demoSichern).
 */
export function browserBackend(): Backend {
  const nichts = async () => {}
  return {
    async laden() {
      try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return seedState()
        const parsed = JSON.parse(raw) as Partial<AppState>
        const base = seedState()
        return {
          profile: { ...base.profile, ...parsed.profile },
          activities: parsed.activities?.length ? parsed.activities : base.activities,
          events: parsed.events ?? [],
          checkIns: parsed.checkIns ?? [],
          warnings: parsed.warnings ?? [],
          signals: parsed.signals?.length ? parsed.signals : base.signals,
        }
      } catch {
        return seedState()
      }
    },
    profilSpeichern: nichts,
    aktivitaetSpeichern: nichts,
    aktivitaetLoeschen: nichts,
    termineSpeichern: nichts,
    termineLoeschen: nichts,
    checkInSpeichern: nichts,
    warnungSpeichern: nichts,
    signalSpeichern: nichts,
    signalLoeschen: nichts,
    async alleDatenLoeschen() {
      localStorage.removeItem(KEY)
    },
  }
}

/* -------------------------------------------------------- Studien-Modus -- */

/** Datenbankzeile -> App-Typ und zurück. Die Datenbank nutzt snake_case. */
const alsAktivitaet = (r: Record<string, unknown>): Activity => ({
  id: r.id as string,
  name: r.name as string,
  icon: r.icon as string,
  category: r.category as Activity['category'],
  ratePer30: Number(r.rate_per_30),
})

const alsTermin = (r: Record<string, unknown>): EnergyEvent => ({
  id: r.id as string,
  date: r.date as string,
  start: r.start_min as number,
  durationMin: r.duration_min as number,
  activityId: r.activity_id as string,
  title: (r.title as string) ?? undefined,
  note: (r.note as string) ?? undefined,
  seriesId: (r.series_id as string) ?? undefined,
})

const alsCheckIn = (r: Record<string, unknown>): CheckIn => ({
  id: r.id as string,
  date: r.date as string,
  slot: r.slot as CheckIn['slot'],
  level: r.level as number,
  note: (r.note as string) ?? undefined,
})

const alsSignal = (r: Record<string, unknown>): Signal => ({
  id: r.id as string,
  name: r.name as string,
  severity: r.severity as Signal['severity'],
  icon: (r.icon as string) ?? 'alert',
})

const alsWarnung = (r: Record<string, unknown>): WarningLog => ({
  id: r.id as string,
  at: r.at as string,
  severity: r.severity as WarningLog['severity'],
  signals: (r.signals as string[]) ?? [],
})

/** Wirft bei Datenbankfehlern, damit der Store sie sichtbar machen kann. */
function pruefe(fehler: { message: string } | null, was: string) {
  if (fehler) throw new Error(`${was}: ${fehler.message}`)
}

export function supabaseBackend(userId: string): Backend {
  const db = supabase!
  return {
    async laden() {
      const [profil, aktivitaeten, termine, checkIns, warnungen, signale] = await Promise.all([
        db.from('profiles').select('*').eq('id', userId).single(),
        db.from('activities').select('*').eq('user_id', userId).order('created_at'),
        db.from('events').select('*').eq('user_id', userId),
        db.from('check_ins').select('*').eq('user_id', userId),
        db.from('warnings').select('*').eq('user_id', userId).order('at', { ascending: false }),
        db.from('signals').select('*').eq('user_id', userId).order('created_at'),
      ])
      pruefe(profil.error, 'Profil laden')
      pruefe(aktivitaeten.error, 'Aktivitäten laden')
      pruefe(termine.error, 'Termine laden')
      pruefe(checkIns.error, 'Check-ins laden')
      pruefe(warnungen.error, 'Warnsignale laden')
      pruefe(signale.error, 'Signalliste laden')

      const p = profil.data!
      const basis = seedState().profile
      return {
        profile: {
          ...basis,
          name: p.code,
          age: p.age ?? null,
          status: p.status,
          sleepStart: p.sleep_start,
          sleepEnd: p.sleep_end,
          warnThreshold: p.warn_threshold,
          stopThreshold: p.stop_threshold,
          notificationsEnabled: p.notifications_enabled,
          checkInDisplay: p.check_in_display,
        },
        activities: (aktivitaeten.data ?? []).map(alsAktivitaet),
        events: (termine.data ?? []).map(alsTermin),
        checkIns: (checkIns.data ?? []).map(alsCheckIn),
        warnings: (warnungen.data ?? []).map(alsWarnung),
        signals: (signale.data ?? []).map(alsSignal),
      }
    },

    async profilSpeichern(p) {
      const { error } = await db
        .from('profiles')
        .update({
          age: p.age,
          status: p.status,
          sleep_start: p.sleepStart,
          sleep_end: p.sleepEnd,
          warn_threshold: p.warnThreshold,
          stop_threshold: p.stopThreshold,
          notifications_enabled: p.notificationsEnabled,
          check_in_display: p.checkInDisplay,
        })
        .eq('id', userId)
      pruefe(error, 'Profil speichern')
    },

    async aktivitaetSpeichern(a) {
      const { error } = await db.from('activities').upsert({
        id: a.id,
        user_id: userId,
        name: a.name,
        icon: a.icon,
        category: a.category,
        rate_per_30: a.ratePer30,
      })
      pruefe(error, 'Aktivität speichern')
    },

    async aktivitaetLoeschen(id) {
      const { error } = await db.from('activities').delete().eq('id', id)
      pruefe(error, 'Aktivität löschen')
    },

    async termineSpeichern(termine) {
      if (!termine.length) return
      const { error } = await db.from('events').upsert(
        termine.map((e) => ({
          id: e.id,
          user_id: userId,
          date: e.date,
          start_min: e.start,
          duration_min: e.durationMin,
          activity_id: e.activityId,
          title: e.title ?? null,
          note: e.note ?? null,
          series_id: e.seriesId ?? null,
        })),
      )
      pruefe(error, 'Termine speichern')
    },

    async termineLoeschen(ids) {
      if (!ids.length) return
      const { error } = await db.from('events').delete().in('id', ids)
      pruefe(error, 'Termine löschen')
    },

    async checkInSpeichern(c) {
      // Pro Tag und Tageszeit nur ein Eintrag – erneutes Erfassen überschreibt.
      const { error } = await db
        .from('check_ins')
        .upsert(
          { id: c.id, user_id: userId, date: c.date, slot: c.slot, level: c.level, note: c.note ?? null },
          { onConflict: 'user_id,date,slot' },
        )
      pruefe(error, 'Check-in speichern')
    },

    async warnungSpeichern(w) {
      const { error } = await db.from('warnings').insert({
        id: w.id,
        user_id: userId,
        at: w.at,
        severity: w.severity,
        signals: w.signals,
      })
      pruefe(error, 'Warnsignal speichern')
    },

    async signalSpeichern(sig) {
      const { error } = await db.from('signals').upsert({
        id: sig.id,
        user_id: userId,
        name: sig.name,
        severity: sig.severity,
        icon: sig.icon,
      })
      pruefe(error, 'Signal speichern')
    },

    async signalLoeschen(id) {
      const { error } = await db.from('signals').delete().eq('id', id)
      pruefe(error, 'Signal löschen')
    },

    async alleDatenLoeschen() {
      // Reihenfolge egal, alles haengt per Fremdschluessel am Nutzer.
      for (const tabelle of ['events', 'check_ins', 'warnings', 'activities', 'signals']) {
        const { error } = await db.from(tabelle).delete().eq('user_id', userId)
        pruefe(error, `${tabelle} löschen`)
      }
    },
  }
}
