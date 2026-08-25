import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { useStore } from '../store'
import { Icon } from './Icon'
import { AktivitaetsIcon } from './AktivitaetsIcon'
import { ICON_GRUPPEN } from '../lib/aktivitaetsIcons'
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
  // Selbst gewaehltes Symbol schlaegt den Vorschlag. Solange nichts gewaehlt
  // ist, wird aus dem Namen geraten – das trifft oft, aber laengst nicht immer,
  // deshalb steht die Auswahl gleich daneben offen.
  const [gewaehlt, setGewaehlt] = useState<string | null>(activity?.icon ?? null)
  const [auswahlOffen, setAuswahlOffen] = useState(false)
  const geraten = useMemo(() => guessIcon(name), [name])
  const icon = gewaehlt ?? geraten

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
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div style={{ textAlign: 'center' }}>
          <span className="lbl" style={{ display: 'block', marginBottom: 7 }}>
            Symbol
          </span>
          <div className={`icon-preview ${CAT_CLASS[category]}`}>
            <AktivitaetsIcon name={icon} size={30} />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn ghost sm"
        style={{ marginTop: 4 }}
        onClick={() => setAuswahlOffen((o) => !o)}
      >
        <Icon name="sparkle" size={14} />
        {auswahlOffen ? 'Auswahl schließen' : 'Symbol auswählen'}
      </button>

      {auswahlOffen && (
        <div className="icon-auswahl">
          {ICON_GRUPPEN.map((gruppe) => (
            <div key={gruppe.titel}>
              <p className="icon-gruppe-titel">{gruppe.titel}</p>
              <div className="icon-raster">
                {gruppe.icons.map((i) => (
                  <button
                    key={i.name}
                    type="button"
                    title={i.label}
                    aria-label={i.label}
                    className={`icon-wahl ${icon === i.name ? 'an' : ''}`}
                    onClick={() => {
                      setGewaehlt(i.name)
                      setAuswahlOffen(false)
                    }}
                  >
                    <i.C size={23} strokeWidth={1.7} absoluteStrokeWidth />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
          // Erst speichern, dann melden. Frueher stand der Aufruf in den
          // Argumenten von onSaved?.() -- bei optionalem Aufruf wertet
          // JavaScript die Argumente aber gar nicht aus, sodass ohne
          // onSaved-Empfaenger nichts gespeichert wurde.
          const saved = { id: activity?.id, name: name.trim(), icon, category, ratePer30: signed }
          const gespeichert = { ...saved, id: upsertActivity(saved) }
          onSaved?.(gespeichert)
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
