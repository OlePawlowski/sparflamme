import type { IconName } from '../components/Icon'
import type { Category } from '../types'

/** Beschriftung und Symbol der drei Bereiche – an einer Stelle gepflegt,
 *  damit Termin-, Aktivitäts- und Profilansicht nicht auseinanderlaufen. */
export const CAT_LABEL: Record<Category, string> = {
  green: 'Geben Energie',
  orange: 'Neutral',
  red: 'Kosten Kraft',
}

export const CAT_ICON: Record<Category, IconName> = {
  green: 'trendUp',
  orange: 'trendFlat',
  red: 'trendDown',
}

export const CAT_ORDER: Category[] = ['green', 'orange', 'red']
