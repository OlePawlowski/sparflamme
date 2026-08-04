import { useState } from 'react'
import { Sheet } from './Sheet'
import { useStore } from '../store'
import { ACTIVITY_ICONS, Icon, type IconName } from './Icon'
import type { Activity, Category } from '../types'

const CAT_LABEL: Record<Category, string> = {
  green: 'Lädt auf',
  orange: 'Neutral',
  red: 'Zieht Energie',
}

const CAT_CLASS: Record<Category, string> = { green: 'green', orange: 'amber', red: 'red' }

export function ActivitySheet({
  activity,
  defaultCategory,
  onSaved,
  onClose,
}: {
  activity?: Activity
  defaultCategory?: Category
  /** Wird nach dem Speichern mit der gespeicherten Aktivität aufgerufen. */
  onSaved?: (activity: Activity) => void
  onClose: () => void
}) {
  const { upsertActivity, removeActivity } = useStore()
  const [name, setName] = useState(activity?.name ?? '')
  const [icon, setIcon] = useState<IconName>((activity?.icon as IconName) ?? 'dot')
  const [category, setCategory] = useState<Category>(activity?.category ?? defaultCategory ?? 'red')
  const [rate, setRate] = useState(Math.abs(activity?.ratePer30 ?? 5))

  const signed = category === 'orange' ? 0 : category === 'green' ? rate : -rate

  return (
    <Sheet
      title={activity ? 'Aktivität bearbeiten' : 'Neue Aktivität'}
      subtitle="Wie stark wirkt sie pro 30 Minuten?"
      onClose={onClose}
    >
      <div className="field">
        <span className="lbl">Bereich</span>
        <div className="chips">
          {(['green', 'orange', 'red'] as Category[]).map((c) => (
            <button
              key={c}
              className={`chip ${CAT_CLASS[c]} ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {CAT_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="lbl">Name</span>
        <input className="input" value={name} placeholder="z. B. Chorprobe" onChange={(e) => setName(e.target.value)} />
      </label>

      <div className="field">
        <span className="lbl">Symbol</span>
        <div className="pick">
          {ACTIVITY_ICONS.map((n) => (
            <button key={n} className={icon === n ? 'active' : ''} onClick={() => setIcon(n)}>
              <Icon name={n} size={19} />
            </button>
          ))}
        </div>
      </div>

      {category !== 'orange' && (
        <div className="field">
          <span className="lbl">Wirkung pro 30 Minuten</span>
          <input type="range" min={1} max={30} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          <p
            className="num"
            style={{
              textAlign: 'center',
              marginTop: 14,
              fontSize: 20,
              fontWeight: 600,
              color: category === 'green' ? 'var(--green)' : 'var(--red)',
            }}
          >
            {signed > 0 ? '+' : ''}
            {signed}% / 30 Min
          </p>
        </div>
      )}

      <button
        className="btn primary block"
        style={{ marginTop: 20 }}
        disabled={!name.trim()}
        onClick={() => {
          const saved = { id: activity?.id, name: name.trim(), icon, category, ratePer30: signed }
          onSaved?.({ ...saved, id: upsertActivity(saved) })
          onClose()
        }}
      >
        Speichern
      </button>

      {activity && (
        <button
          className="btn ghost block"
          style={{ marginTop: 6, color: 'var(--red)' }}
          onClick={() => {
            removeActivity(activity.id)
            onClose()
          }}
        >
          Aktivität löschen
        </button>
      )}
    </Sheet>
  )
}
