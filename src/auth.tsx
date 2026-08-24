import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { codeZuKennung, studienModus, supabase } from './lib/supabase'

export type Rolle = 'participant' | 'researcher'

interface Sitzung {
  userId: string
  code: string
  rolle: Rolle
}

interface AuthWert {
  /** null = nicht angemeldet. Im Demo-Modus immer eine Pseudo-Sitzung. */
  sitzung: Sitzung | null
  laedt: boolean
  registrieren: (code: string, passwort: string) => Promise<void>
  anmelden: (code: string, passwort: string) => Promise<void>
  abmelden: () => Promise<void>
}

const Ctx = createContext<AuthWert | null>(null)

const DEMO: Sitzung = { userId: 'demo', code: 'Demo', rolle: 'participant' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sitzung, setSitzung] = useState<Sitzung | null>(studienModus ? null : DEMO)
  const [laedt, setLaedt] = useState(studienModus)

  /**
   * Profil (Code und Rolle) nachladen, mit Wiederholungen.
   *
   * Beim Start auf dem Handy steht die Verbindung oft noch nicht, wenn die
   * Abfrage losgeht. Ein einzelner Fehlschlag darf deshalb nicht bedeuten,
   * dass jemand als abgemeldet gilt.
   */
  const profilLaden = async (userId: string): Promise<{ code: string; rolle: Rolle } | null> => {
    for (let versuch = 0; versuch < 3; versuch++) {
      const { data, error } = await supabase!.from('profiles').select('code, rolle').eq('id', userId).single()
      if (!error && data) return { code: data.code, rolle: data.rolle as Rolle }
      if (versuch < 2) await new Promise((r) => setTimeout(r, 400 * (versuch + 1)))
    }
    return null
  }

  /**
   * Aus dem angemeldeten Konto eine Sitzung bauen. Scheitert das Profil auch
   * nach den Wiederholungen, bleibt die Person trotzdem angemeldet -- der Code
   * steht auch in den Anmeldedaten, und 'participant' ist die Rolle mit den
   * wenigeren Rechten. Lieber eine eingeschraenkte Ansicht als jemand, der
   * ohne Grund sein Passwort neu eintippen soll.
   */
  const sitzungAus = async (user: { id: string; user_metadata?: Record<string, unknown> }): Promise<Sitzung> => {
    const profil = await profilLaden(user.id)
    return {
      userId: user.id,
      code: profil?.code ?? (user.user_metadata?.code as string) ?? '',
      rolle: profil?.rolle ?? 'participant',
    }
  }

  useEffect(() => {
    if (!studienModus) return
    let abgebrochen = false

    supabase!.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      const s = user ? await sitzungAus(user) : null
      if (!abgebrochen) {
        setSitzung(s)
        setLaedt(false)
      }
    })

    const { data: listener } = supabase!.auth.onAuthStateChange(async (_ereignis, session) => {
      const user = session?.user
      const s = user ? await sitzungAus(user) : null
      if (abgebrochen) return
      // Nur setzen, wenn sich inhaltlich etwas geaendert hat. Ein blosser
      // Token-Wechsel soll die Oberflaeche nicht neu aufbauen.
      setSitzung((bisher) =>
        bisher?.userId === s?.userId && bisher?.code === s?.code && bisher?.rolle === s?.rolle
          ? bisher
          : s,
      )
    })

    return () => {
      abgebrochen = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const wert = useMemo<AuthWert>(
    () => ({
      sitzung,
      laedt,
      async registrieren(code, passwort) {
        const { error } = await supabase!.auth.signUp({
          email: codeZuKennung(code),
          password: passwort,
          // Der Code landet in den Metadaten; ein Trigger legt daraus das Profil an.
          options: { data: { code: code.trim() } },
        })
        if (error) throw new Error(uebersetze(error.message))
      },
      async anmelden(code, passwort) {
        const { error } = await supabase!.auth.signInWithPassword({
          email: codeZuKennung(code),
          password: passwort,
        })
        if (error) throw new Error(uebersetze(error.message))
      },
      async abmelden() {
        await supabase!.auth.signOut()
        setSitzung(null)
      },
    }),
    [sitzung, laedt],
  )

  return <Ctx.Provider value={wert}>{children}</Ctx.Provider>
}

/** Supabase antwortet auf Englisch – für Probanden verständlich machen. */
function uebersetze(meldung: string): string {
  const m = meldung.toLowerCase()
  if (m.includes('invalid login')) return 'Code oder Passwort stimmt nicht.'
  if (m.includes('already registered')) return 'Diesen Code gibt es schon. Bitte anmelden statt registrieren.'
  if (m.includes('password should be')) return 'Das Passwort muss mindestens 6 Zeichen haben.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Zu viele Versuche. Bitte kurz warten.'
  if (m.includes('failed to fetch')) return 'Keine Verbindung zum Server. Ist Internet da?'
  return meldung
}

export function useAuth(): AuthWert {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth außerhalb des AuthProvider')
  return c
}
