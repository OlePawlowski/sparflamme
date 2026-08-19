import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { useStore } from '../store'
import { ACTIVITY_ICONS, Icon, type IconName } from './Icon'
import { CAT_ICON, CAT_LABEL, CAT_ORDER } from '../lib/categories'
import { guessIcon } from '../lib/iconGuess'
import type { Activity, Category } from '../types'

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
  const [category, setCategory] = useState<Category>(activity?.category ?? defaultCategory ?? 'red')
  const [rate, setRate] = useState(Math.abs(activity?.ratePer30 ?? 5))
  const [iconOffset, setIconOffset] = useState(0)

  // Symbol wird aus dem Namen erraten – kein manuelles Auswählen nötig. Ein
  // "anderes Symbol"-Klick blättert innerhalb der Icon-Bibliothek weiter.
  const guessedIndex = useMemo(() => ACTIVITY_ICONS.indexOf(guessIcon(name)), [name])
  const icon: IconName = activity && iconOffset === 0
    ? ((activity.icon as IconName) ?? 'sparkle')
    : ACTIVITY_ICONS[(Math.max(guessedIndex, 0) + iconOffset + ACTIVITY_ICONS.length) % ACTIVITY_ICONS.length]

  const signed = category === 'orange' ? 0 : category === 'green' ? rate : -rate

  return (
    <Sheet
      title={activity ? 'Aktivität bearbeiten' : 'Neue Aktivität'}
      subtitle="Wie stark wirkt sie pro 30 Minuten?"
      onClose={onClose}
    >
      <div className="field">
        <span className="lbl">Bereich</span>
        <div className="cat-wahl">
          {CAT_ORDER.map((c) => (
            <button
              key={c}
              className={`cat-karte ${CAT_CLASS[c]} ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              <Icon name={CAT_ICON[c]} size={28} strokeWidth={1.8} />
              <span>{CAT_LABEL[c]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field row" style={{ gap: 14, alignItems: 'flex-end' }}>
        <label style={{ flex: 1 }}>
          <span className="lbl">Name</span>
          <input
            className="input"
            value={name}
            placeholder="z. B. Chorprobe"
            onChange={(e) => {
              setName(e.target.value)
              setIconOffset(0)
            }}
          />
        </label>
        <div style={{ textAlign: 'center' }}>
          <span className="lbl" style={{ display: 'block', marginBottom: 7 }}>
            Symbol
          </span>
          <div className={`icon-preview ${CAT_CLASS[category]}`}>
            <Icon name={icon} size={30} />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn ghost sm"
        style={{ marginTop: 4 }}
        onClick={() => setIconOffset((o) => o + 1)}
      >
        <Icon name="sparkle" size={14} />
        Anderes Symbol
      </button>

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
