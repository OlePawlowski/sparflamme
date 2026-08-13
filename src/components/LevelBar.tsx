import { levelBand } from '../lib/energy'

const BAND_COLOR = { good: '#3f7a58', mid: '#a8762a', low: '#a8443a' }

/**
 * Horizontaler Füllstandsbalken – ersetzt die frühere Batteriegrafik.
 * Länge und Farbe zeigen den Energiestatus auf einen Blick.
 */
export function LevelBar({
  level,
  width = 220,
  height = 14,
  muted = false,
}: {
  level: number
  width?: number | string
  height?: number
  muted?: boolean
}) {
  const color = muted ? '#c9c4bc' : BAND_COLOR[levelBand(level)]
  const pct = Math.max(level > 0 ? 3 : 0, Math.min(100, level))

  return (
    <div
      role="img"
      aria-label={`Energielevel ${Math.round(level)} Prozent`}
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: 'var(--line)',
        overflow: 'hidden',
        flex: 'none',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: height / 2,
          background: color,
          transition: 'width .35s ease, background .35s ease',
        }}
      />
    </div>
  )
}
