export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ flex: 'none' }}>
      <path d="M50 14a22 22 0 1 1 -8-6.5" fill="none" stroke="#3f7a58" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="14" r="2.4" fill="#3f7a58" />
      <circle cx="42" cy="7.5" r="1.6" fill="#3f7a58" />
      <rect x="24" y="20" width="16" height="30" rx="4" fill="#fff" stroke="#1e1c1a" strokeWidth="3" />
      <rect x="29" y="15.5" width="6" height="5.5" rx="1.5" fill="#1e1c1a" />
      <rect x="27" y="25" width="10" height="6" rx="1.2" fill="#3f7a58" />
      <rect x="27" y="32.5" width="10" height="6" rx="1.2" fill="#a8762a" />
      <rect x="27" y="40" width="10" height="6" rx="1.2" fill="#a8443a" />
    </svg>
  )
}
