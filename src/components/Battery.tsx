import { levelBand } from '../lib/energy'

const BAND_COLOR = { good: '#3f7a58', mid: '#a8762a', low: '#a8443a' }

/** Segmentierte Batterie – das Leitmotiv der App. Bewusst schlicht gezeichnet. */
export function Battery({ level, size = 64, muted = false }: { level: number; size?: number; muted?: boolean }) {
  const w = size * 0.56
  const h = size
  const segs = 5
  const filled = Math.max(level > 0 ? 1 : 0, Math.round((level / 100) * segs))
  const color = muted ? '#98938c' : BAND_COLOR[levelBand(level)]
  const stroke = muted ? '#d4d0c9' : '#1e1c1a'

  const sw = Math.max(1.2, w * 0.055)
  const capW = w * 0.36
  const capH = h * 0.045
  const bodyY = capH
  const bodyH = h - capH
  const pad = w * 0.14
  const innerH = bodyH - pad * 2
  const gap = pad * 0.4
  const segH = (innerH - gap * (segs - 1)) / segs

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`Energielevel ${Math.round(level)} Prozent`}>
      <rect x={(w - capW) / 2} y={0} width={capW} height={capH * 2} rx={capH} fill={stroke} />
      <rect
        x={sw / 2}
        y={bodyY}
        width={w - sw}
        height={bodyH - sw / 2}
        rx={w * 0.14}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      {Array.from({ length: segs }).map((_, i) => {
        const idx = segs - 1 - i
        return (
          <rect
            key={i}
            x={pad}
            y={bodyY + pad + idx * (segH + gap)}
            width={w - pad * 2}
            height={segH}
            rx={segH * 0.22}
            fill={i < filled ? color : 'transparent'}
          />
        )
      })}
    </svg>
  )
}
