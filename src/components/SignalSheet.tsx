import { useState } from 'react'
import { Sheet } from './Sheet'
import { useStore } from '../store'
import { Icon } from './Icon'
import { AktivitaetsIcon } from './AktivitaetsIcon'
import { ICON_GRUPPEN } from '../lib/aktivitaetsIcons'
import type { Signal } from '../types'

export function SignalSheet({ onClose }: { onClose: () => void }) {
  const { state, addWarning, upsertSignal, removeSignal } = useStore()
  const [gewaehlt, setGewaehlt] = useState<string[]>([])

  // Eigenes Signal anlegen – aufgeklappt nur, wenn man es braucht.
  const [neuOffen, setNeuOffen] = useState(false)
  const [neuName, setNeuName] = useState('')
  const [neuSchwere, setNeuSchwere] = useState<Signal['severity']>('warn')
  const [neuIcon, setNeuIcon] = useState('zap')
  const [iconWahlOffen, setIconWahlOffen] = useState(false)

  const warnSignale = state.signals.filter((s) => s.severity === 'warn')
  const stopSignale = state.signals.filter((s) => s.severity === 'stop')

  const umschalten = (name: string) =>
    setGewaehlt((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]))

  // Ein einziges Abbruchsignal genügt, damit die Erfassung als Abbruch zählt.
  const schwere: Signal['severity'] = gewaehlt.some((n) =>
    stopSignale.some((s) => s.name === n),
  )
    ? 'stop'
    : 'warn'

  const liste = (signale: Signal[], klasse: string) => (
    <div className="signal-liste">
      {signale.map((s) => (
        <button
          key={s.id}
          className={`signal-zeile ${klasse} ${gewaehlt.includes(s.name) ? 'an' : ''}`}
          onClick={() => umschalten(s.name)}
        >
          <span className="ico">
            <AktivitaetsIcon name={s.icon} size={22} />
          </span>
          <span className="signal-name">{s.name}</span>
          <span className={`radio ${gewaehlt.includes(s.name) ? 'an' : ''}`} />
        </button>
      ))}
      {signale.length === 0 && <div className="empty-state">Noch nichts eingetragen.</div>}
    </div>
  )

  return (
    <Sheet title="Warnsignale" subtitle="Was nimmst du gerade an dir wahr?" onClose={onClose}>
      <p className="section-title" style={{ color: 'var(--amber)' }}>
        Erste Warnsignale – noch handelbar
      </p>
      {liste(warnSignale, 'amber')}

      <p className="section-title" style={{ color: 'var(--red)' }}>
        Abbruch – bitte sofort ausruhen
      </p>
      {liste(stopSignale, 'red')}

      {/* Eigenes Signal: Reizüberflutung kündigt sich bei jedem anders an. */}
      {!neuOffen ? (
        <button className="btn block" style={{ marginTop: 14 }} onClick={() => setNeuOffen(true)}>
          <Icon name="plus" size={16} />
          Eigenes Warnsignal ergänzen
        </button>
      ) : (
        <div className="card" style={{ marginTop: 14 }}>
          <label className="field" style={{ marginTop: 0 }}>
            <span className="lbl">Wie macht es sich bemerkbar?</span>
            <input
              className="input"
              value={neuName}
              placeholder="z. B. Ohrgeräusche"
              onChange={(e) => setNeuName(e.target.value)}
            />
          </label>

          <div className="field">
            <span className="lbl">Wie dringend ist es?</span>
            <div className="chips">
              <button
                className={`chip amber ${neuSchwere === 'warn' ? 'active' : ''}`}
                onClick={() => setNeuSchwere('warn')}
              >
                Noch handelbar
              </button>
              <button
                className={`chip red ${neuSchwere === 'stop' ? 'active' : ''}`}
                onClick={() => setNeuSchwere('stop')}
              >
                Bitte abbrechen
              </button>
            </div>
          </div>

          <div className="field row" style={{ gap: 14, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <span className="lbl">Piktogramm</span>
              <button
                type="button"
                className="btn ghost sm"
                style={{ marginTop: 6 }}
                onClick={() => setIconWahlOffen((o) => !o)}
              >
                <Icon name="sparkle" size={14} />
                {iconWahlOffen ? 'Auswahl schließen' : 'Piktogramm auswählen'}
              </button>
            </div>
            <div className={`icon-preview ${neuSchwere === 'stop' ? 'red' : 'amber'}`}>
              <AktivitaetsIcon name={neuIcon} size={28} />
            </div>
          </div>

          {iconWahlOffen && (
            <div className="icon-auswahl">
              {ICON_GRUPPEN.map((gruppe) => (
                <div key={gruppe.titel}>
                  <p className="icon-gruppe-titel">{gruppe.titel}</p>
                  <div className="icon-raster">
                    {gruppe.icons.map((i) => (
                      <button
                        key={i.name}
                        type="button"
                        title={i.label}
                        aria-label={i.label}
                        className={`icon-wahl ${neuIcon === i.name ? 'an' : ''}`}
                        onClick={() => {
                          setNeuIcon(i.name)
                          setIconWahlOffen(false)
                        }}
                      >
                        <i.C size={23} strokeWidth={1.7} absoluteStrokeWidth />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="row" style={{ gap: 6, marginTop: 12 }}>
            <button
              className="btn primary"
              style={{ flex: 1 }}
              disabled={!neuName.trim()}
              onClick={() => {
                upsertSignal({ name: neuName.trim(), severity: neuSchwere, icon: neuIcon })
                setNeuName('')
                setNeuIcon('zap')
                setNeuOffen(false)
              }}
            >
              Signal speichern
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setNeuOffen(false)
                setNeuName('')
                setIconWahlOffen(false)
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {gewaehlt.length > 0 && (
        <div
          className="card"
          style={{
            marginTop: 18,
            background: schwere === 'stop' ? 'var(--red-tint)' : 'var(--amber-tint)',
            borderColor: schwere === 'stop' ? '#ecdcda' : '#ebe2d2',
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500, color: schwere === 'stop' ? 'var(--red)' : 'var(--amber)' }}>
            {schwere === 'stop'
              ? 'Brich deine Aktivität ab und ruh dich aus.'
              : 'Achte auf dein Energielevel – Termin verschieben?'}
          </p>
        </div>
      )}

      <button
        className="btn primary block"
        style={{ marginTop: 16 }}
        disabled={!gewaehlt.length}
        onClick={() => {
          addWarning({ at: new Date().toISOString(), severity: schwere, signals: gewaehlt })
          onClose()
        }}
      >
        <Icon name="check" size={16} />
        Erfassen
      </button>

      {/* Eigene Signale wieder loswerden, ohne Umweg über die Einstellungen. */}
      {state.signals.some((s) => !s.id.startsWith('s-')) && (
        <details className="signal-verwalten">
          <summary>Eigene Signale verwalten</summary>
          {state.signals
            .filter((s) => !s.id.startsWith('s-'))
            .map((s) => (
              <div key={s.id} className="act-row">
                <span className="ico">
                  <AktivitaetsIcon name={s.icon} size={20} />
                </span>
                <span style={{ flex: 1, fontSize: 13.5 }}>{s.name}</span>
                <button
                  className="btn ghost sm"
                  style={{ color: 'var(--red)' }}
                  onClick={() => {
                    setGewaehlt((p) => p.filter((n) => n !== s.name))
                    removeSignal(s.id)
                  }}
                >
                  Löschen
                </button>
              </div>
            ))}
        </details>
      )}
    </Sheet>
  )
}
