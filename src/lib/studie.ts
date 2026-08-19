import type { ProbandenDaten } from './auswertung'
import { supabase } from './supabase'

/**
 * Lädt die Daten aller Teilnehmenden. Funktioniert nur für Konten mit der
 * Rolle "researcher" – bei allen anderen liefert die Datenbank durch die
 * Row-Level-Security schlicht nur die eigenen Zeilen zurück.
 */
export async function alleProbandenLaden(): Promise<ProbandenDaten[]> {
  const db = supabase!
  const [profile, aktivitaeten, termine, checkIns, warnungen] = await Promise.all([
    db.from('profiles').select('id, code, rolle').order('code'),
    db.from('activities').select('*'),
    db.from('events').select('*'),
    db.from('check_ins').select('*'),
    db.from('warnings').select('*'),
  ])

  const fehler = [profile, aktivitaeten, termine, checkIns, warnungen].find((r) => r.error)
  if (fehler?.error) throw new Error(fehler.error.message)

  const proNutzer = <T extends { user_id: string }>(zeilen: T[] | null, id: string) =>
    (zeilen ?? []).filter((z) => z.user_id === id)

  return (profile.data ?? [])
    .filter((p) => p.rolle === 'participant')
    .map((p) => ({
      userId: p.id,
      code: p.code,
      activities: proNutzer(aktivitaeten.data, p.id).map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        category: r.category,
        ratePer30: Number(r.rate_per_30),
      })),
      events: proNutzer(termine.data, p.id).map((r) => ({
        id: r.id,
        date: r.date,
        start: r.start_min,
        durationMin: r.duration_min,
        activityId: r.activity_id,
        title: r.title ?? undefined,
        note: r.note ?? undefined,
        seriesId: r.series_id ?? undefined,
      })),
      checkIns: proNutzer(checkIns.data, p.id).map((r) => ({
        id: r.id,
        date: r.date,
        slot: r.slot,
        level: r.level,
        note: r.note ?? undefined,
      })),
      warnings: proNutzer(warnungen.data, p.id).map((r) => ({
        id: r.id,
        at: r.at,
        severity: r.severity,
        signals: r.signals ?? [],
      })),
    }))
}
