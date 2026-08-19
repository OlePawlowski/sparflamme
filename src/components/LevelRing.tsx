import { levelBand } from '../lib/energy'

const BAND_COLOR = { good: '#3f7a58', mid: '#a8762a', low: '#a8443a' }

/**
 * Ringanzeige um den Prozentwert – der Ring füllt sich im Uhrzeigersinn und
 * hat eine kleine Lücke oben rechts, damit Anfang und Ende erkennbar bleiben.
 */
export function LevelRing({
  level,
  size = 168,
  children,
}: {
  level: number
  size?: number
  children?: React.ReactNode
}) {
  const stroke = Math.round(size * 0.075)
  const r = (size - stroke) / 2 - 2
  const c = size / 2
  const umfang = 2 * Math.PI * r
  // Lücke oben rechts: der Ring läuft über 88 % des Kreises.
  const anteil = 0.88
  const bogen = umfang * anteil
  const gefuellt = bogen * Math.max(0, Math.min(100, level)) / 100
  const color = BAND_COLOR[levelBand(level)]

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-84deg)' }}
        role="img"
        aria-label={`Energielevel ${Math.round(level)} Prozent`}
      >
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="rgba(30,28,26,0.09)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${bogen} ${umfang - bogen}`}
        />
        {/* Bei 0 % gar nichts zeichnen – sonst bliebe durch den runden
            Abschluss ein Punkt stehen. */}
        {gefuellt > 0 && (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${gefuellt} ${umfang - gefuellt}`}
            style={{ transition: 'stroke-dasharray .45s ease, stroke .45s ease' }}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {children}
      </div>
    </div>
  )
}
