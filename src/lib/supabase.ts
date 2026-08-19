import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Ist die App mit einem Supabase-Projekt verbunden?
 *
 * Ohne Zugangsdaten läuft sie im Demo-Modus: alles bleibt im Browser, es gibt
 * keine Anmeldung und keine Auswertung. Für die Studie muss dieser Wert true
 * sein – sonst landen die Daten nicht auf dem Server.
 */
export const studienModus = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = studienModus
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

/**
 * Aus dem pseudonymen Code wird eine technische Kennung gebaut, weil Supabase
 * Auth eine E-Mail-Adresse verlangt. An diese Adresse wird nie etwas gesendet;
 * die Domain ist bewusst nicht auflösbar (RFC 2606).
 */
export function codeZuKennung(code: string): string {
  return `${code.trim().toLowerCase()}@probanden.invalid`
}
