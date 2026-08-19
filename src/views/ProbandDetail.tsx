import { useMemo } from 'react'
import { Icon } from '../components/Icon'
import { aktivitaetenBilanz, kennzahlen, type ProbandenDaten } from '../lib/auswertung'
import { buildDayCurve, eventEnd, fmtTime, levelBand } from '../lib/energy'
import type { AppState } from '../types'

const BAND_FARBE = { good: 'var(--green)', mid: 'var(--amber)', low: 'var(--red)' }

/** Tagesreihenfolge, nicht alphabetisch. */
const SLOT_REIHENFOLGE = { morning: 0, noon: 1, evening: 2 } as const
const SLOT_NAME = { morning: 'Morgens', noon: 'Mittags', evening: 'Abends' } as const

/** Einzelansicht: Verlauf und Einträge einer Person über den Studienzeitraum. */
export function ProbandDetail({ daten, onBack }: { daten: ProbandenDaten; onBack: () => void }) {
  const k = useMemo(() => kennzahlen(daten), [daten])
  const bilanz = useMemo(() => aktivitaetenBilanz(daten), [daten])

  const tage = useMemo(() => {
    const menge = new Set<string>([...daten.checkIns.map((c) => c.date), ...daten.events.map((e) => e.date)])
    const zustand: AppState = {
      profile: {
        name: '', age: null, status: '', sleepStart: 22 * 60, sleepEnd: 7 * 60,
        warnThreshold: 25, stopThreshold: 10, notificationsEnabled: false, checkInDisplay: 'single',
      },
      activities: daten.activities,
      events: daten.events,
      checkIns: daten.checkIns,
      warnings: [],
    }
    return [...menge].sort().map((tag) => {
      const kurve = buildDayCurve(zustand, tag, null)
      return {
        tag,
        start: kurve.length ? Math.round(kurve[0].level) : null,
        ende: kurve.length ? Math.round(kurve[kurve.length - 1].level) : null,
        tief: kurve.length ? Math.round(Math.min(...kurve.map((p) => p.level))) : null,
        checkIns: daten.checkIns.filter((c) => c.date === tag).sort((a, b) => SLOT_REIHENFOLGE[a.slot] - SLOT_REIHENFOLGE[b.slot]),
        termine: daten.events.filter((e) => e.date === tag).sort((a, b) => a.start - b.start),
      }
    })
  }, [daten])

  return (
    <div className="dashboard">
      <div className="dash-kopf">
        <div className="row" style={{ gap: 10 }}>
          <button className="btn icon" aria-label="Zurück" onClick={onBack}>
            <Icon name="arrowLeft" size={18} />
          </button>
          <div>
            <h1 className="mono">{daten.code}</h1>
            <p className="sub">
              {k.ersterTag ? `${k.ersterTag} bis ${k.letzterTag} · ${k.aktiveTage} aktive Tage` : 'Noch keine Daten'}
            </p>
          </div>
        </div>
      </div>

      <div className="dash-inhalt">
        <div className="kennzahl-reihe">
          <Kennzahl wert={k.checkIns} label="Check-ins" />
          <Kennzahl wert={k.termine} label="Termine" />
          <Kennzahl wert={k.mittleresLevel === null ? '–' : `${k.mittleresLevel}%`} label="Ø Level" />
          <Kennzahl wert={k.tiefstesLevel === null ? '–' : `${k.tiefstesLevel}%`} label="Tiefpunkt" />
          <Kennzahl wert={k.beteiligung === null ? '–' : `${k.beteiligung}%`} label="Beteiligung" />
        </div>

        {bilanz.length > 0 && (
          <>
            <p className="section-title">
              <Icon name="trendDown" size={15} />
              Energiebilanz nach Aktivität
            </p>
            <div className="card">
              {bilanz.map((b) => (
                <div key={b.name} className={`act-row ${b.category}`}>
                  <span style={{ flex: 1, fontSize: 14 }}>{b.name}</span>
                  <span className="tiny">{b.anzahl}×</span>
                  <span className={`delta ${b.summe > 0 ? 'pos' : b.summe < 0 ? 'neg' : 'zero'}`}>
                    {b.summe > 0 ? '+' : ''}
                    {b.summe}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="section-title">
          <Icon name="calendar" size={15} />
          Tage im Studienzeitraum
        </p>
        {tage.length === 0 && <div className="card empty-state">Diese Person hat noch nichts erfasst.</div>}
        {tage.map((t) => (
          <div key={t.tag} className="card" style={{ marginBottom: 8 }}>
            <div className="spread">
              <span style={{ fontWeight: 500 }}>
                {new Date(t.tag).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })}
              </span>
              <span className="row" style={{ gap: 14 }}>
                <span className="tiny">Start {t.start ?? '–'}%</span>
                <span className="tiny">Tief {t.tief ?? '–'}%</span>
                <span
                  className="num"
                  style={{ fontWeight: 600, color: t.ende === null ? undefined : BAND_FARBE[levelBand(t.ende)] }}
                >
                  {t.ende ?? '–'}%
                </span>
              </span>
            </div>

            {t.checkIns.length > 0 && (
              <div className="done-slots" style={{ marginTop: 10 }}>
                {t.checkIns.map((c) => (
                  <span key={c.id} className="done-slot">
                    {SLOT_NAME[c.slot]}
                    <span className="val">{c.level}%</span>
                  </span>
                ))}
              </div>
            )}

            {t.termine.map((e) => {
              const a = daten.activities.find((x) => x.id === e.activityId)
              return (
                <div key={e.id} className={`act-row ${a?.category ?? ''}`}>
                  <span className="tiny" style={{ width: 92 }}>
                    {fmtTime(e.start)}–{fmtTime(eventEnd(e))}
                  </span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{e.title || a?.name || 'Termin'}</span>
                  <span className="tiny">{a?.name}</span>
                </div>
              )
            })}
          </div>
        ))}

        {daten.warnings.length > 0 && (
          <>
            <p className="section-title">
              <Icon name="alert" size={15} />
              Erfasste Warnsignale
            </p>
            <div className="card">
              {daten.warnings.map((w) => (
                <div key={w.id} className="act-row">
                  <span className={`dot ${w.severity === 'stop' ? 'red' : 'orange'}`} />
                  <span style={{ flex: 1, fontSize: 13 }}>{w.signals.join(', ')}</span>
                  <span className="tiny">{new Date(w.at).toLocaleString('de-DE')}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Kennzahl({ wert, label }: { wert: string | number; label: string }) {
  return (
    <div className="card kennzahl">
      <div className="kennzahl-wert num">{wert}</div>
      <div className="tiny">{label}</div>
    </div>
  )
}
