import type { ReactNode } from 'react'

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
  return (
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
}
