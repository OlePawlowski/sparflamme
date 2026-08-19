import { useState } from 'react'
import { useStore } from '../store'
import { ActivitySheet } from '../components/ActivitySheet'
import { SignalSheet } from '../components/SignalSheet'
import { CAT_ICON, CAT_LABEL } from '../lib/categories'
import { Icon, type IconName } from '../components/Icon'
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
  // Listen bleiben zu, bis die Kategorie angetippt wird – so ist die Seite ruhig.
  const [offen, setOffen] = useState<Category | null>(null)

  return (
    <>
      <div className="appbar">
        <div className="row" style={{ gap: 10 }}>
          <Logo size={30} />
          <div>
            <h1>Sparflamme</h1>
            <p className="sub">Deine Aktivitäten</p>
          </div>
        </div>
      </div>

      <div className="scroll">
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
          const aktivitaeten = state.activities.filter((a) => a.category === c.key)
          const aufgeklappt = offen === c.key
          return (
            <div key={c.key} className={`kategorie ${CAT_CLASS[c.key]} ${aufgeklappt ? 'auf' : ''}`}>
              <button className="kategorie-kopf" onClick={() => setOffen(aufgeklappt ? null : c.key)}>
                <span className="big-ico">
                  <Icon name={CAT_ICON[c.key]} size={26} />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span className="kategorie-name">{CAT_LABEL[c.key]}</span>
                  <span className="muted">{c.hint}</span>
                </span>
                <span className="kategorie-zahl">{aktivitaeten.length}</span>
                <span className={`kategorie-pfeil ${aufgeklappt ? 'auf' : ''}`}>
                  <Icon name="chevron" size={18} />
                </span>
              </button>

              {aufgeklappt && (
                <div className="kategorie-inhalt">
                  {aktivitaeten.map((a) => (
                    <button
                      key={a.id}
                      className={`act-row ${a.category}`}
                      onClick={() => setSheet({ open: true, activity: a })}
                    >
                      <span className="ico">
                        <Icon name={a.icon as IconName} size={24} />
                      </span>
                      <span style={{ flex: 1, fontSize: 14.5 }}>{a.name}</span>
                      <span className={`delta ${a.ratePer30 > 0 ? 'pos' : a.ratePer30 < 0 ? 'neg' : 'zero'}`}>
                        {a.ratePer30 > 0 ? '+' : ''}
                        {a.ratePer30}% / 30 Min
                      </span>
                    </button>
                  ))}
                  <button className="btn sm block" style={{ marginTop: 12 }} onClick={() => setSheet({ open: true })}>
                    <Icon name="plus" size={16} />
                    Aktivität hinzufügen
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sheet?.open && (
        <ActivitySheet activity={sheet.activity} defaultCategory={offen ?? undefined} onClose={() => setSheet(null)} />
      )}
      {signalSheet && <SignalSheet onClose={() => setSignalSheet(false)} />}
    </>
  )
}
