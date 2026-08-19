import { useState } from 'react'
import { Sheet } from './Sheet'
import { LevelRing } from './LevelRing'
import { SLOT_LABEL, levelLabel } from '../lib/energy'
import type { Slot } from '../types'

const BANDS = [
  { key: 'good', label: 'gut', min: 51, max: 100, preview: 100 },
  { key: 'mid', label: 'geht so', min: 25, max: 49, preview: 40 },
  { key: 'low', label: 'schlecht', min: 0, max: 24, preview: 12 },
] as const

export function CheckInSheet({
  slot,
  initial,
  onSave,
  onClose,
}: {
  slot: Slot
  initial?: number
  onSave: (level: number) => void
  onClose: () => void
}) {
  const initialBand = initial === undefined ? null : (BANDS.find((b) => initial >= b.min && initial <= b.max) ?? null)
  const [band, setBand] = useState<(typeof BANDS)[number] | null>(initialBand)
  const [level, setLevel] = useState<number>(initial ?? 75)

  const pick = (b: (typeof BANDS)[number]) => {
    setBand(b)
    setLevel(Math.round((b.min + b.max) / 2))
  }

  return (
    <Sheet title={SLOT_LABEL[slot]} subtitle="Wie geht es dir gerade?" onClose={onClose}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 8, marginTop: 18 }}>
        {BANDS.map((b) => {
          const active = band?.key === b.key
          return (
            <button
              key={b.key}
              onClick={() => pick(b)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '16px 6px 14px',
                borderRadius: 12,
                background: active ? 'var(--surface)' : 'transparent',
                border: `1px solid ${active ? 'var(--line-strong)' : 'transparent'}`,
              }}
            >
              <LevelRing level={b.preview} size={72}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{b.preview}%</span>
              </LevelRing>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--ink)' : 'var(--ink-2)' }}>
                {b.label}
              </span>
              <span className="tiny">
                {b.min}–{b.max}%
              </span>
            </button>
          )
        })}
      </div>

      {band && (
        <div className="card" style={{ marginTop: 12 }}>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Wie schätzt du dein Energielevel ein?</p>
          <input
            type="range"
            min={band.min}
            max={band.max}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
          <div className="spread" style={{ marginTop: 8 }}>
            <span className="tiny">{band.min}%</span>
            <span className="tiny">{band.max}%</span>
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 18, gap: 6 }}>
            <input
              className="input num"
              style={{ width: 78, textAlign: 'center', fontSize: 19, fontWeight: 600 }}
              inputMode="numeric"
              value={level}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ''))
                if (!Number.isNaN(n)) setLevel(Math.min(band.max, Math.max(band.min, n)))
              }}
            />
            <span style={{ fontSize: 17, color: 'var(--ink-2)' }}>%</span>
          </div>
          <p className="muted" style={{ textAlign: 'center', marginTop: 10 }}>
            entspricht „{levelLabel(level)}“
          </p>
        </div>
      )}

      <button className="btn primary block" style={{ marginTop: 16 }} disabled={!band} onClick={() => band && onSave(level)}>
        Speichern
      </button>
    </Sheet>
  )
}
