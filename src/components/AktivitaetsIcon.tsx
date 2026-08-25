import { aktivitaetsIcon } from '../lib/aktivitaetsIcons'

/** Symbol einer Aktivität. Der Name kommt aus der Datenbank. */
export function AktivitaetsIcon({ name, size = 24 }: { name?: string; size?: number }) {
  const C = aktivitaetsIcon(name)
  return <C size={size} strokeWidth={1.7} absoluteStrokeWidth />
}
