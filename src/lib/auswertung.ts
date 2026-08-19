import type { Activity, AppState, CheckIn, EnergyEvent, WarningLog } from '../types'
import { buildDayCurve, eventDelta, eventEnd, fmtTime } from './energy'

/** Alle Daten einer Person, wie sie das Dashboard bekommt. */
export interface ProbandenDaten {
  userId: string
  code: string
  activities: Activity[]
  events: EnergyEvent[]
  checkIns: CheckIn[]
  warnings: WarningLog[]
}

export interface Kennzahlen {
  code: string
  /** Tage mit mindestens einem Check-in oder Termin. */
  aktiveTage: number
  checkIns: number
  termine: number
  warnsignale: number
  abbruchsignale: number
  /** Mittelwert aller Check-in-Werte, null wenn keine vorliegen. */
  mittleresLevel: number | null
  tiefstesLevel: number | null
  hoechstesLevel: number | null
  ersterTag: string | null
  letzterTag: string | null
  /** Anteil der Studientage mit Eintrag – das übliche Adhärenzmaß. */
  beteiligung: number | null
}

function tageZwischen(von: string, bis: string): number {
  const ms = new Date(bis).getTime() - new Date(von).getTime()
  return Math.round(ms / 86_400_000) + 1
}

export function kennzahlen(d: ProbandenDaten): Kennzahlen {
  const tage = new Set<string>()
  d.checkIns.forEach((c) => tage.add(c.date))
  d.events.forEach((e) => tage.add(e.date))
  const sortiert = [...tage].sort()
  const werte = d.checkIns.map((c) => c.level)
  const ersterTag = sortiert[0] ?? null
  const letzterTag = sortiert[sortiert.length - 1] ?? null

  return {
    code: d.code,
    aktiveTage: tage.size,
    checkIns: d.checkIns.length,
    termine: d.events.length,
    warnsignale: d.warnings.length,
    abbruchsignale: d.warnings.filter((w) => w.severity === 'stop').length,
    mittleresLevel: werte.length ? Math.round((werte.reduce((a, b) => a + b, 0) / werte.length) * 10) / 10 : null,
    tiefstesLevel: werte.length ? Math.min(...werte) : null,
    hoechstesLevel: werte.length ? Math.max(...werte) : null,
    ersterTag,
    letzterTag,
    beteiligung:
      ersterTag && letzterTag ? Math.round((tage.size / tageZwischen(ersterTag, letzterTag)) * 100) : null,
  }
}

/** Welche Aktivitäten summiert am meisten Energie gekostet bzw. gegeben haben. */
export function aktivitaetenBilanz(d: ProbandenDaten): { name: string; category: string; summe: number; anzahl: number }[] {
  const summen = new Map<string, { summe: number; anzahl: number }>()
  for (const e of d.events) {
    const a = d.activities.find((x) => x.id === e.activityId)
    if (!a) continue
    const bisher = summen.get(a.id) ?? { summe: 0, anzahl: 0 }
    summen.set(a.id, { summe: bisher.summe + eventDelta(e, d.activities), anzahl: bisher.anzahl + 1 })
  }
  return [...summen.entries()]
    .map(([id, v]) => {
      const a = d.activities.find((x) => x.id === id)!
      return { name: a.name, category: a.category, summe: Math.round(v.summe), anzahl: v.anzahl }
    })
    .sort((x, y) => x.summe - y.summe)
}

/** Häufigkeit der einzelnen Warnsignale über alle Probanden. */
export function signalHaeufigkeit(alle: ProbandenDaten[]): { signal: string; anzahl: number; severity: string }[] {
  const zaehler = new Map<string, { anzahl: number; severity: string }>()
  for (const d of alle) {
    for (const w of d.warnings) {
      for (const s of w.signals) {
        const bisher = zaehler.get(s) ?? { anzahl: 0, severity: w.severity }
        zaehler.set(s, { anzahl: bisher.anzahl + 1, severity: bisher.severity })
      }
    }
  }
  return [...zaehler.entries()]
    .map(([signal, v]) => ({ signal, ...v }))
    .sort((a, b) => b.anzahl - a.anzahl)
}

/* ------------------------------------------------------------ CSV-Export -- */

/** Semikolon als Trennzeichen, damit Excel im deutschen Gebietsschema es direkt öffnet. */
function csv(zeilen: (string | number | null)[][]): string {
  const feld = (v: string | number | null) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM voranstellen, sonst zeigt Excel Umlaute falsch an.
  return '﻿' + zeilen.map((z) => z.map(feld).join(';')).join('\r\n')
}

export function checkInsAlsCsv(alle: ProbandenDaten[]): string {
  const zeilen: (string | number | null)[][] = [['code', 'datum', 'tageszeit', 'level']]
  for (const d of alle) {
    for (const c of [...d.checkIns].sort((a, b) => a.date.localeCompare(b.date))) {
      zeilen.push([d.code, c.date, c.slot, c.level])
    }
  }
  return csv(zeilen)
}

export function termineAlsCsv(alle: ProbandenDaten[]): string {
  const zeilen: (string | number | null)[][] = [
    ['code', 'datum', 'beginn', 'ende', 'dauer_min', 'aktivitaet', 'bereich', 'rate_pro_30min', 'wirkung_prozent', 'titel'],
  ]
  for (const d of alle) {
    for (const e of [...d.events].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)) {
      const a = d.activities.find((x) => x.id === e.activityId)
      zeilen.push([
        d.code,
        e.date,
        fmtTime(e.start),
        fmtTime(eventEnd(e)),
        e.durationMin,
        a?.name ?? '',
        a?.category ?? '',
        a?.ratePer30 ?? '',
        Math.round(eventDelta(e, d.activities)),
        e.title ?? '',
      ])
    }
  }
  return csv(zeilen)
}

export function warnsignaleAlsCsv(alle: ProbandenDaten[]): string {
  const zeilen: (string | number | null)[][] = [['code', 'zeitpunkt', 'schwere', 'signale']]
  for (const d of alle) {
    for (const w of [...d.warnings].sort((a, b) => a.at.localeCompare(b.at))) {
      zeilen.push([d.code, w.at, w.severity, w.signals.join(' | ')])
    }
  }
  return csv(zeilen)
}

/** Ein Wert je Person und Tag – das Format, mit dem in SPSS/R meist gerechnet wird. */
export function tagesverlaufAlsCsv(alle: ProbandenDaten[]): string {
  const zeilen: (string | number | null)[][] = [
    ['code', 'datum', 'start_level', 'end_level', 'tiefpunkt', 'aufladen_prozent', 'verbrauch_prozent', 'anzahl_termine'],
  ]
  for (const d of alle) {
    const tage = [...new Set([...d.checkIns.map((c) => c.date), ...d.events.map((e) => e.date)])].sort()
    for (const tag of tage) {
      const zustand: AppState = {
        profile: standardProfil(),
        activities: d.activities,
        events: d.events,
        checkIns: d.checkIns,
        warnings: [],
      }
      const kurve = buildDayCurve(zustand, tag, null)
      const termineDesTages = d.events.filter((e) => e.date === tag)
      const auf = termineDesTages.reduce((s, e) => s + Math.max(0, eventDelta(e, d.activities)), 0)
      const ab = termineDesTages.reduce((s, e) => s + Math.min(0, eventDelta(e, d.activities)), 0)
      zeilen.push([
        d.code,
        tag,
        kurve.length ? Math.round(kurve[0].level) : '',
        kurve.length ? Math.round(kurve[kurve.length - 1].level) : '',
        kurve.length ? Math.round(Math.min(...kurve.map((p) => p.level))) : '',
        Math.round(auf),
        Math.round(ab),
        termineDesTages.length,
      ])
    }
  }
  return csv(zeilen)
}

function standardProfil(): AppState['profile'] {
  return {
    name: '',
    age: null,
    status: '',
    sleepStart: 22 * 60,
    sleepEnd: 7 * 60,
    warnThreshold: 25,
    stopThreshold: 10,
    notificationsEnabled: false,
    checkInDisplay: 'single',
  }
}

/** Loest den Download im Browser aus. */
export function csvHerunterladen(name: string, inhalt: string) {
  const blob = new Blob([inhalt], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
