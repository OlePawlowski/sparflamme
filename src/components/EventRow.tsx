import { eventDelta, eventEnd, fmtTime } from '../lib/energy'
import { useStore } from '../store'
import { Icon, type IconName } from './Icon'
import type { EnergyEvent } from '../types'

export function EventRow({ event, now, onClick }: { event: EnergyEvent; now?: number; onClick?: () => void }) {
  const { state } = useStore()
  const activity = state.activities.find((a) => a.id === event.activityId)
  const delta = Math.round(eventDelta(event, state.activities))
  const running = now !== undefined && now >= event.start && now < eventEnd(event)

  return (
    <button className={`event ${activity?.category ?? ''} ${running ? 'now' : ''}`} onClick={onClick}>
      <span className="ico">
        <Icon name={(activity?.icon ?? 'dot') as IconName} size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="title" style={{ display: 'block' }}>
          {event.title || activity?.name || 'Termin'}
        </span>
        <span className="meta">
          {fmtTime(event.start)}–{fmtTime(eventEnd(event))}
          {running ? ' · läuft gerade' : ''}
          {event.note ? ` · ${event.note}` : ''}
        </span>
      </span>
      <span className={`delta ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'zero'}`}>
        {delta > 0 ? '+' : ''}
        {delta}%
      </span>
    </button>
  )
}
