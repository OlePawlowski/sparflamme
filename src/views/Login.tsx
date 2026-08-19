import { useState } from 'react'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'

export function Login() {
  const { registrieren, anmelden } = useAuth()
  const [neu, setNeu] = useState(false)
  const [code, setCode] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  const gueltig = /^[A-Za-z0-9_-]{3,32}$/.test(code.trim()) && passwort.length >= 6

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gueltig || laeuft) return
    setLaeuft(true)
    setFehler(null)
    try {
      if (neu) await registrieren(code, passwort)
      else await anmelden(code, passwort)
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="login">
      <form className="login-karte" onSubmit={absenden}>
        <Logo size={64} />
        <h1>Sparflamme</h1>
        <p className="login-sub">
          {neu ? 'Neuen Zugang mit deinem Studien-Code anlegen' : 'Mit deinem Studien-Code anmelden'}
        </p>

        <label className="field" style={{ width: '100%' }}>
          <span className="lbl">Studien-Code</span>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="z. B. SPF-04"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
          />
        </label>

        <label className="field" style={{ width: '100%' }}>
          <span className="lbl">Passwort</span>
          <input
            className="input"
            type="password"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            placeholder="mindestens 6 Zeichen"
            autoComplete={neu ? 'new-password' : 'current-password'}
          />
        </label>

        {fehler && (
          <p className="field-error" style={{ width: '100%' }}>
            <Icon name="alert" size={14} />
            {fehler}
          </p>
        )}

        <button className="btn primary block" style={{ marginTop: 18 }} disabled={!gueltig || laeuft}>
          <Icon name="check" size={16} />
          {laeuft ? 'Einen Moment…' : neu ? 'Zugang anlegen' : 'Anmelden'}
        </button>

        <button
          type="button"
          className="btn ghost block"
          style={{ marginTop: 6 }}
          onClick={() => {
            setNeu((n) => !n)
            setFehler(null)
          }}
        >
          {neu ? 'Ich habe schon einen Zugang' : 'Neuen Zugang anlegen'}
        </button>

        <p className="login-hinweis">
          Dein Code ist ein Pseudonym. Die App speichert weder deinen Namen noch deine E-Mail-Adresse.
        </p>
      </form>
    </div>
  )
}
