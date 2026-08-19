import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import {
  aktivitaetenBilanz,
  checkInsAlsCsv,
  csvHerunterladen,
  kennzahlen,
  signalHaeufigkeit,
  tagesverlaufAlsCsv,
  termineAlsCsv,
  warnsignaleAlsCsv,
  type ProbandenDaten,
} from '../lib/auswertung'
import { alleProbandenLaden } from '../lib/studie'
import { ProbandDetail } from './ProbandDetail'

export function Dashboard() {
  const { sitzung, abmelden } = useAuth()
  const [daten, setDaten] = useState<ProbandenDaten[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [offen, setOffen] = useState<string | null>(null)

  useEffect(() => {
    alleProbandenLaden().then(setDaten).catch((e) => setFehler(e.message))
  }, [])

  const zeilen = useMemo(() => (daten ?? []).map(kennzahlen), [daten])
  const gesamt = useMemo(() => {
    if (!daten) return null
    const alleWerte = daten.flatMap((d) => d.checkIns.map((c) => c.level))
    return {
      probanden: daten.length,
      mitDaten: zeilen.filter((z) => z.aktiveTage > 0).length,
      checkIns: zeilen.reduce((s, z) => s + z.checkIns, 0),
      termine: zeilen.reduce((s, z) => s + z.termine, 0),
      warnsignale: zeilen.reduce((s, z) => s + z.warnsignale, 0),
      mittel: alleWerte.length
        ? Math.round((alleWerte.reduce((a, b) => a + b, 0) / alleWerte.length) * 10) / 10
        : null,
    }
  }, [daten, zeilen])

  const signale = useMemo(() => (daten ? signalHaeufigkeit(daten) : []), [daten])
  const bilanz = useMemo(() => {
    if (!daten) return []
    // Über alle Probanden zusammengefasst, nach Aktivitätsname gruppiert.
    const summen = new Map<string, { summe: number; anzahl: number; category: string }>()
    for (const d of daten) {
      for (const b of aktivitaetenBilanz(d)) {
        const bisher = summen.get(b.name) ?? { summe: 0, anzahl: 0, category: b.category }
        summen.set(b.name, { summe: bisher.summe + b.summe, anzahl: bisher.anzahl + b.anzahl, category: b.category })
      }
    }
    return [...summen.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => a.summe - b.summe)
  }, [daten])

  const detail = daten?.find((d) => d.userId === offen)
  if (detail) return <ProbandDetail daten={detail} onBack={() => setOffen(null)} />

  const heute = new Date().toISOString().slice(0, 10)
  // Ab hier ist der Ladezustand abgehandelt; geladen ist garantiert vorhanden.
  const geladen = daten

  return (
    <div className="dashboard">
      <div className="dash-kopf">
        <div className="row" style={{ gap: 12 }}>
          <Logo size={34} />
          <div>
            <h1>Studien-Dashboard</h1>
            <p className="sub">Angemeldet als {sitzung?.code}</p>
          </div>
        </div>
        <button className="btn sm" onClick={abmelden}>
          Abmelden
        </button>
      </div>

      <div className="dash-inhalt">
        {fehler && (
          <div className="card" style={{ borderColor: 'var(--red)' }}>
            <p className="field-error" style={{ marginTop: 0 }}>
              <Icon name="alert" size={15} />
              {fehler}
            </p>
          </div>
        )}

        {!daten && !fehler && <div className="card empty-state">Daten werden geladen…</div>}

        {geladen && gesamt && (
          <>
            <div className="kennzahl-reihe">
              <Kennzahl wert={`${gesamt.mitDaten}/${gesamt.probanden}`} label="Aktive Probanden" />
              <Kennzahl wert={gesamt.checkIns} label="Check-ins" />
              <Kennzahl wert={gesamt.termine} label="Termine" />
              <Kennzahl wert={gesamt.warnsignale} label="Warnsignale" />
              <Kennzahl wert={gesamt.mittel === null ? '–' : `${gesamt.mittel}%`} label="Mittleres Level" />
            </div>

            <p className="section-title">
              <Icon name="users" size={15} />
              Teilnehmende
            </p>
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="tabelle">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Aktive Tage</th>
                    <th>Beteiligung</th>
                    <th>Check-ins</th>
                    <th>Termine</th>
                    <th>Ø Level</th>
                    <th>Tief</th>
                    <th>Signale</th>
                    <th>Zeitraum</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {zeilen.map((z, i) => (
                    <tr key={z.code} onClick={() => setOffen(geladen[i].userId)}>
                      <td className="mono">{z.code}</td>
                      <td>{z.aktiveTage}</td>
                      <td>{z.beteiligung === null ? '–' : `${z.beteiligung}%`}</td>
                      <td>{z.checkIns}</td>
                      <td>{z.termine}</td>
                      <td>{z.mittleresLevel === null ? '–' : `${z.mittleresLevel}%`}</td>
                      <td>{z.tiefstesLevel === null ? '–' : `${z.tiefstesLevel}%`}</td>
                      <td>
                        {z.warnsignale}
                        {z.abbruchsignale > 0 && <span style={{ color: 'var(--red)' }}> ({z.abbruchsignale})</span>}
                      </td>
                      <td className="tiny">
                        {z.ersterTag ? `${z.ersterTag} – ${z.letzterTag}` : 'keine Daten'}
                      </td>
                      <td>
                        <Icon name="chevron" size={15} />
                      </td>
                    </tr>
                  ))}
                  {zeilen.length === 0 && (
                    <tr>
                      <td colSpan={10} className="empty-state">
                        Noch keine Probanden registriert.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="section-title">
              <Icon name="trendDown" size={15} />
              Was zieht am meisten – über alle Probanden
            </p>
            <div className="card">
              {bilanz.length === 0 && <div className="empty-state">Noch keine Termine erfasst.</div>}
              {bilanz.slice(0, 10).map((b) => (
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

            <p className="section-title">
              <Icon name="alert" size={15} />
              Häufigste Warnsignale
            </p>
            <div className="card">
              {signale.length === 0 && <div className="empty-state">Noch keine Warnsignale erfasst.</div>}
              {signale.slice(0, 12).map((s) => (
                <div key={s.signal} className="act-row">
                  <span className={`dot ${s.severity === 'stop' ? 'red' : 'orange'}`} />
                  <span style={{ flex: 1, fontSize: 13.5 }}>{s.signal}</span>
                  <span className="delta zero">{s.anzahl}×</span>
                </div>
              ))}
            </div>

            <p className="section-title">
              <Icon name="chart" size={15} />
              Rohdaten für SPSS, R oder Excel
            </p>
            <div className="card">
              <p className="muted" style={{ marginBottom: 12 }}>
                Semikolon-getrennt mit BOM – Excel öffnet die Dateien direkt korrekt.
              </p>
              <div className="export-reihe">
                <button className="btn sm" onClick={() => csvHerunterladen(`sparflamme-checkins-${heute}.csv`, checkInsAlsCsv(geladen))}>
                  Check-ins
                </button>
                <button className="btn sm" onClick={() => csvHerunterladen(`sparflamme-termine-${heute}.csv`, termineAlsCsv(geladen))}>
                  Termine
                </button>
                <button className="btn sm" onClick={() => csvHerunterladen(`sparflamme-tagesverlauf-${heute}.csv`, tagesverlaufAlsCsv(geladen))}>
                  Tagesverlauf
                </button>
                <button className="btn sm" onClick={() => csvHerunterladen(`sparflamme-warnsignale-${heute}.csv`, warnsignaleAlsCsv(geladen))}>
                  Warnsignale
                </button>
              </div>
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
