import type { IconName } from '../components/Icon'

/**
 * Ordnet Aktivitätsnamen automatisch ein passendes Symbol zu, damit beim
 * Anlegen einer Aktivität keine manuelle Auswahl nötig ist. Erste
 * Übereinstimmung gewinnt, daher stehen spezifischere Begriffe vorn.
 */
const RULES: { icon: IconName; words: string[] }[] = [
  { icon: 'bed', words: ['schlaf', 'nickerchen', 'nap', 'bett'] },
  { icon: 'bath', words: ['bad', 'dusch', 'wanne'] },
  { icon: 'sofa', words: ['ausruh', 'entspann', 'relax', 'nichtstun', 'chillen'] },
  { icon: 'candle', words: ['meditat', 'achtsam', 'ruhe', 'stille'] },
  { icon: 'tree', words: ['spazier', 'wald', 'natur', 'garten', 'park'] },
  { icon: 'run', words: ['joggen', 'laufen', 'sport', 'training', 'fitness'] },
  { icon: 'yoga', words: ['yoga', 'dehnen', 'stretch'] },
  { icon: 'cup', words: ['tee', 'kaffee', 'trinken'] },
  { icon: 'plate', words: ['essen', 'kochen', 'mittag', 'frühstück', 'abendessen', 'snack'] },
  { icon: 'gamepad', words: ['zocken', 'gaming', 'spielekonsole', 'ps5', 'switch'] },
  { icon: 'puzzle', words: ['puzzle', 'brettspiel', 'gesellschaftsspiel'] },
  { icon: 'book', words: ['buch', 'lesen', 'roman'] },
  { icon: 'paint', words: ['malen', 'zeichnen', 'basteln', 'kreativ', 'kunst'] },
  { icon: 'music', words: ['musik', 'instrument', 'gitarre', 'klavier', 'singen', 'chor'] },
  { icon: 'headphones', words: ['podcast', 'hörbuch', 'musik hören'] },
  { icon: 'train', words: ['zug', 'bahn', 'fahren', 'reise', 'urlaub'] },
  { icon: 'dog', words: ['hund', 'katze', 'tier', 'haustier'] },
  { icon: 'walk', words: ['gehen', 'spaziergang'] },
  { icon: 'school', words: ['schule', 'uni', 'universität', 'unterricht', 'klausur', 'lernen', 'hausaufgaben'] },
  { icon: 'briefcase', words: ['arbeit', 'büro', 'job', 'meeting', 'termin beruf', 'homeoffice'] },
  { icon: 'phone', words: ['telefon', 'anruf', 'call'] },
  { icon: 'user2', words: ['freund', 'freundin', 'date', 'verabred'] },
  { icon: 'users', words: ['leute', 'bekannte', 'kontakt', 'gruppe', 'familie'] },
  { icon: 'cake', words: ['geburtstag', 'feier', 'party'] },
  { icon: 'ticket', words: ['konzert', 'markt', 'festival', 'veranstaltung', 'kino', 'event'] },
  { icon: 'cart', words: ['einkauf', 'besorgung', 'shopping'] },
  { icon: 'stethoscope', words: ['arzt', 'therapie', 'behandlung', 'medizin', 'zahnarzt'] },
]

export function guessIcon(name: string): IconName {
  const n = name.trim().toLowerCase()
  if (!n) return 'sparkle'
  for (const rule of RULES) {
    if (rule.words.some((w) => n.includes(w))) return rule.icon
  }
  return 'sparkle'
}
