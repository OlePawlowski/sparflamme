/** Bildmarke der App – identisch zu public/favicon.svg. Ring und Batterie sind
 *  konzentrisch um (32,32) aufgebaut, damit das Icon in jeder Kachel mittig sitzt. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ flex: 'none' }}>
      <path d="M49.5 18.7A22 22 0 1 1 41.5 12.15" fill="none" stroke="#3f7a58" strokeWidth="4" strokeLinecap="round" />
      <circle cx="49.5" cy="18.7" r="2.2" fill="#3f7a58" />
      <circle cx="41.5" cy="12.15" r="1.4" fill="#3f7a58" />
      <rect x="29" y="17.5" width="6" height="4.5" rx="1.5" fill="#1e1c1a" />
      <rect x="24.75" y="20.5" width="14.5" height="24.75" rx="3.5" fill="#fff" stroke="#1e1c1a" strokeWidth="2.5" />
      <rect x="27.5" y="23.4" width="9" height="5" rx="1.2" fill="#3f7a58" />
      <rect x="27.5" y="30.4" width="9" height="5" rx="1.2" fill="#a8762a" />
      <rect x="27.5" y="37.4" width="9" height="5" rx="1.2" fill="#a8443a" />
    </svg>
  )
}
