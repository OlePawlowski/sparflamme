import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Icon } from './Icon'

/**
 * Passwort selbst ändern. Nötig, weil die Zugänge über pseudonyme Codes laufen
 * und es deshalb keine E-Mail-Adresse gibt, an die ein Zurücksetzen-Link gehen
 * könnte. Wer sein Passwort ändern will, muss es hier tun – angemeldet.
 */
export function PasswortAendern() {
  const [offen, setOffen] = useState(false)
  const [neu, setNeu] = useState('')
  const [wdh, setWdh] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [fertig, setFertig] = useState(false)

  const zuKurz = neu.length > 0 && neu.length < 6
  const ungleich = wdh.length > 0 && neu !== wdh
  const gueltig = neu.length >= 6 && neu === wdh

  const speichern = async () => {
    if (!gueltig || laeuft) return
    setLaeuft(true)
    setFehler(null)
    const { error } = await supabase!.auth.updateUser({ password: neu })
    setLaeuft(false)
    if (error) {
      setFehler(
        error.message.toLowerCase().includes('should be different')
          ? 'Das ist dein bisheriges Passwort. Bitte wähle ein anderes.'
          : error.message,
      )
      return
    }
    setNeu('')
    setWdh('')
    setFertig(true)
    setOffen(false)
  }

  if (!offen) {
    return (
      <>
        <button
          className="btn block"
          style={{ marginTop: 24 }}
          onClick={() => {
            setOffen(true)
            setFertig(false)
          }}
        >
          <Icon name="lock" size={16} />
          Passwort ändern
        </button>
        {fertig && (
          <p className="tiny" style={{ color: 'var(--green)', marginTop: 8, textAlign: 'center' }}>
            Passwort geändert. Beim nächsten Anmelden gilt das neue.
          </p>
        )}
      </>
    )
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <label className="field" style={{ marginTop: 0 }}>
        <span className="lbl">Neues Passwort</span>
        <input
          className="input"
          type="password"
          value={neu}
          autoComplete="new-password"
          placeholder="mindestens 6 Zeichen"
          onChange={(e) => setNeu(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="lbl">Noch einmal zur Sicherheit</span>
        <input
          className="input"
          type="password"
          value={wdh}
          autoComplete="new-password"
          onChange={(e) => setWdh(e.target.value)}
        />
      </label>

      {zuKurz && (
        <p className="field-error">
          <Icon name="alert" size={14} />
          Mindestens 6 Zeichen.
        </p>
      )}
      {ungleich && (
        <p className="field-error">
          <Icon name="alert" size={14} />
          Die beiden Eingaben sind nicht gleich.
        </p>
      )}
      {fehler && (
        <p className="field-error">
          <Icon name="alert" size={14} />
          {fehler}
        </p>
      )}

      <p className="tiny" style={{ marginTop: 12 }}>
        Merk dir das neue Passwort gut. Weil dein Zugang keine E-Mail-Adresse hat,
        kann es niemand für dich zurücksetzen.
      </p>

      <div className="row" style={{ gap: 6, marginTop: 12 }}>
        <button className="btn primary" style={{ flex: 1 }} disabled={!gueltig || laeuft} onClick={speichern}>
          {laeuft ? 'Einen Moment…' : 'Speichern'}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setOffen(false)
            setNeu('')
            setWdh('')
            setFehler(null)
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
