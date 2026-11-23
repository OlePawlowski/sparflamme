import { useState } from 'react'
import { useStore } from '../store'
import { ActivitySheet } from '../components/ActivitySheet'
import { SignalSheet } from '../components/SignalSheet'
import { CAT_ICON, CAT_LABEL } from '../lib/categories'
import { Icon } from '../components/Icon'
import { AktivitaetsIcon } from '../components/AktivitaetsIcon'
import { Logo } from '../components/Logo'
import type { Activity, Category } from '../types'

const CATS: { key: Category; hint: string }[] = [
  { key: 'green', hint: 'Laden dein Level wieder auf' },
  { key: 'orange', hint: 'Verändern dein Level nicht' },
  { key: 'red', hint: 'Zehren an deinem Level' },
]

const CAT_CLASS: Record<Category, string> = { green: 'green', orange: 'amber', red: 'red' }

export function Profile() {
  const { state } = useStore()
  const [sheet, setSheet] = useState<{ open: boolean; activity?: Activity } | null>(null)
  const [signalSheet, setSignalSheet] = useState(false)
  // Eine angetippte Kategorie oeffnet sich als eigene Ansicht. Frueher klappte
  // sie zwischen den anderen auf; die Studienleitung wollte, dass man dann nur
  // noch die angetippte sieht.
  const [offen, setOffen] = useState<Category | null>(null)

  return (
    <>
      <div className="appbar">
        {offen ? (
          <div className="row" style={{ gap: 10 }}>
            <button className="btn icon" aria-label="Zurück zur Übersicht" onClick={() => setOffen(null)}>
              <Icon name="arrowLeft" size={18} />
            </button>
            <div>
              <h1>{CAT_LABEL[offen]}</h1>
              <p className="sub">{CATS.find((c) => c.key === offen)?.hint}</p>
            </div>
          </div>
        ) : (
          <div className="row" style={{ gap: 10 }}>
            <Logo size={30} />
            <div>
              <h1>Sparflamme</h1>
              <p className="sub">Deine Aktivitäten</p>
            </div>
          </div>
        )}
      </div>

      <div className="scroll">
        {!offen && (
          <>
            <button className="card big-row" onClick={() => setSignalSheet(true)}>
              <span className="big-ico amber">
                <Icon name="alert" size={26} />
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>Warnsignale erfassen</span>
                <span className="muted">Reizüberflutung früh erkennen</span>
              </span>
              <Icon name="chevron" size={18} />
            </button>

            {CATS.map((c) => {
              const anzahl = state.activities.filter((a) => a.category === c.key).length
              return (
                <div key={c.key} className={`kategorie ${CAT_CLASS[c.key]}`}>
                  <button className="kategorie-kopf" onClick={() => setOffen(c.key)}>
                    <span className="big-ico">
                      <Icon name={CAT_ICON[c.key]} size={26} />
                    </span>
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      <span className="kategorie-name">{CAT_LABEL[c.key]}</span>
                      <span className="muted">{c.hint}</span>
                    </span>
                    <span className="kategorie-zahl">{anzahl}</span>
                    <span className="kategorie-pfeil">
                      <Icon name="chevron" size={18} />
                    </span>
                  </button>
                </div>
              )
            })}
          </>
        )}

        {offen && (
          <>
            {/* Oben, nicht unter der Liste: sonst muesste man erst durch alle
                Eintraege scrollen, um etwas Neues anzulegen. */}
            <button className="btn primary block" onClick={() => setSheet({ open: true })}>
              <Icon name="plus" size={16} />
              Neue Aktivität anlegen
            </button>

            <div className="card" style={{ marginTop: 10, padding: '2px 14px' }}>
              {state.activities
                .filter((a) => a.category === offen)
                .map((a) => (
                  <button
                    key={a.id}
                    className={`act-row ${a.category}`}
                    onClick={() => setSheet({ open: true, activity: a })}
                  >
                    <span className="ico">
                      <AktivitaetsIcon name={a.icon} size={24} />
                    </span>
                    <span style={{ flex: 1, fontSize: 14.5 }}>{a.name}</span>
                    <span className={`delta ${a.ratePer30 > 0 ? 'pos' : a.ratePer30 < 0 ? 'neg' : 'zero'}`}>
                      {a.ratePer30 > 0 ? '+' : ''}
                      {a.ratePer30}% / 30 Min
                    </span>
                  </button>
                ))}
              {state.activities.filter((a) => a.category === offen).length === 0 && (
                <div className="empty-state">Hier ist noch nichts eingetragen.</div>
              )}
            </div>
          </>
        )}
      </div>

      {sheet?.open && (
        <ActivitySheet activity={sheet.activity} defaultCategory={offen ?? undefined} onClose={() => setSheet(null)} />
      )}
      {signalSheet && <SignalSheet onClose={() => setSignalSheet(false)} />}
    </>
  )
}
