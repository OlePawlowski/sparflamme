import { useState } from 'react'
import { Sheet } from './Sheet'
import { useStore } from '../store'
import { WARNING_SIGNALS_STOP, WARNING_SIGNALS_WARN } from '../lib/seed'

export function SignalSheet({ onClose }: { onClose: () => void }) {
  const { addWarning } = useStore()
  const [picked, setPicked] = useState<string[]>([])

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  const severity: 'warn' | 'stop' = picked.some((s) => WARNING_SIGNALS_STOP.includes(s)) ? 'stop' : 'warn'

  return (
    <Sheet title="Warnsignale" subtitle="Was nimmst du gerade an dir wahr?" onClose={onClose}>
      <p className="section-title" style={{ color: 'var(--amber)' }}>Erste Warnsignale – noch handelbar</p>
      <div className="chips">
        {WARNING_SIGNALS_WARN.map((s) => (
          <button key={s} className={`chip amber ${picked.includes(s) ? 'active' : ''}`} onClick={() => toggle(s)}>
            {s}
          </button>
        ))}
      </div>

      <p className="section-title" style={{ color: 'var(--red)' }}>Abbruch – bitte sofort ausruhen</p>
      <div className="chips">
        {WARNING_SIGNALS_STOP.map((s) => (
          <button key={s} className={`chip red ${picked.includes(s) ? 'active' : ''}`} onClick={() => toggle(s)}>
            {s}
          </button>
        ))}
      </div>

      {picked.length > 0 && (
        <div
          className="card"
          style={{
            marginTop: 18,
            background: severity === 'stop' ? 'var(--red-tint)' : 'var(--amber-tint)',
            borderColor: severity === 'stop' ? '#ecdcda' : '#ebe2d2',
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500, color: severity === 'stop' ? 'var(--red)' : 'var(--amber)' }}>
            {severity === 'stop'
              ? 'Brich deine Aktivität ab und ruh dich aus.'
              : 'Achte auf dein Energielevel – Termin verschieben?'}
          </p>
        </div>
      )}

      <button
        className="btn primary block"
        style={{ marginTop: 16 }}
        disabled={!picked.length}
        onClick={() => {
          addWarning({ at: new Date().toISOString(), severity, signals: picked })
          onClose()
        }}
      >
        Erfassen
      </button>
    </Sheet>
  )
}
