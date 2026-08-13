import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Sheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  const node = (
    <div
      className="backdrop"
      onClick={(e) => {
        // Verschachtelte Sheets: Klick darf das darunterliegende Sheet nicht mitschließen.
        e.stopPropagation()
        onClose()
      }}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
      </div>
    </div>
  )

  // Über ein Portal gerendert, damit verschachtelte Sheets (z. B. "Neue
  // Aktivität" innerhalb "Neuer Termin") nicht vom scrollbaren Container
  // des äußeren Sheets abgeschnitten werden.
  const root = document.getElementById('sheet-root')
  return root ? createPortal(node, root) : node
}
