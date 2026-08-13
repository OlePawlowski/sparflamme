export type IconName =
  | 'battery'
  | 'flame'
  | 'calendar'
  | 'chart'
  | 'user'
  | 'sunrise'
  | 'sun'
  | 'moon'
  | 'alert'
  | 'chevron'
  | 'plus'
  | 'arrowLeft'
  | 'arrowRight'
  | 'bed'
  | 'sofa'
  | 'tree'
  | 'cup'
  | 'gamepad'
  | 'book'
  | 'train'
  | 'walk'
  | 'plate'
  | 'school'
  | 'user2'
  | 'users'
  | 'cake'
  | 'ticket'
  | 'cart'
  | 'stethoscope'
  | 'music'
  | 'phone'
  | 'briefcase'
  | 'bath'
  | 'dog'
  | 'headphones'
  | 'yoga'
  | 'puzzle'
  | 'candle'
  | 'run'
  | 'paint'
  | 'sparkle'
  | 'dot'

const P: Record<IconName, string> = {
  battery: 'M7 7.5A1.5 1.5 0 0 1 8.5 6h7A1.5 1.5 0 0 1 17 7.5v12a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19.5v-12ZM10 4h4M9.5 13.5h5M9.5 17.5h5',
  flame: 'M12 3c1.5 3.5-.5 5-2 6.5S7 13 7 15a5 5 0 0 0 10 0c0-2-1-3.5-2.2-4.8-.6 1.1-1.3 1.6-2 1.6 1-2.7 0-6.3-.8-8.8Z',
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12ZM4 10h16M8.5 3v4M15.5 3v4',
  chart: 'M4 4v15a1 1 0 0 0 1 1h15M7 15l3.5-4 3 2.5L18 8',
  user: 'M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0',
  sunrise: 'M12 4v4M6 10 4.5 8.5M18 10l1.5-1.5M3 18h18M7.5 18a4.5 4.5 0 0 1 9 0M2.5 14H5M19 14h2.5',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2v2.5M12 19.5V22M4.2 4.2 6 6M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8',
  moon: 'M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z',
  alert: 'M12 4.5 2.8 20h18.4L12 4.5ZM12 10v4M12 17h.01',
  chevron: 'm9 5 7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  arrowLeft: 'm14 5-7 7 7 7',
  arrowRight: 'm10 5 7 7-7 7',
  bed: 'M3 18v-8M3 13h18v5M21 18v-3M7.5 10.5h3.5a2 2 0 0 1 2 2v.5H7.5v-2.5ZM3 10h4',
  sofa: 'M4 11V8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5V11M2.5 12.5a2 2 0 0 1 4 0V16h11v-3.5a2 2 0 1 1 4 0V19H2.5v-6.5Z',
  tree: 'M12 21v-5M12 16a5 5 0 0 0 5-5 4.6 4.6 0 0 0-1-2.9A4.5 4.5 0 0 0 12 3a4.5 4.5 0 0 0-4 5.1A4.6 4.6 0 0 0 7 11a5 5 0 0 0 5 5Z',
  cup: 'M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8ZM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 5V3.5M11.5 5V3.5M5 21h12',
  gamepad: 'M7.5 8h9a4.5 4.5 0 0 1 4.5 4.5v.5a3.5 3.5 0 0 1-6.3 2.1l-.5-.6h-4.4l-.5.6A3.5 3.5 0 0 1 3 13v-.5A4.5 4.5 0 0 1 7.5 8ZM7 11v2.5M5.8 12.2h2.4M15.5 11.5h.01M17.5 13.5h.01',
  book: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H18v18H5.5A1.5 1.5 0 0 1 4 19.5v-15ZM7 3v18M18 17H5.5',
  train: 'M6 4.5h12v10H6v-10ZM6 9h12M8.5 12h.01M15.5 12h.01M6 14.5 4 20M18 14.5 20 20M8 17.5h8',
  walk: 'M13.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 21l2-5.5-2.5-2.5.8-4L8 10.5 6.5 13M12.5 9l2.5 2 2 .5M12 15.5l3 2 1 3.5',
  plate: 'M7 3v6a2 2 0 0 0 4 0V3M9 11v10M15.5 21v-7.5c-1.3-.5-2.2-2-2.2-3.8 0-2.6 1.1-5.3 2.7-6.7 1.6 1.4 2.7 4.1 2.7 6.7 0 1.8-.9 3.3-2.2 3.8',
  school: 'M3 20h18M5 20V10l7-4.5 7 4.5v10M9.5 20v-5h5v5M12 2.5v3',
  user2: 'M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 20a6.5 6.5 0 0 1 13 0',
  users: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.5a6.5 6.5 0 0 1 3.5 5.5',
  cake: 'M4 20h16M4.5 20v-6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2V20M4.5 15.5c1.5 0 1.5 1.5 3 1.5s1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5M8.5 11.5V9M12 11.5V9M15.5 11.5V9M8.5 6.5V5M12 6.5V5M15.5 6.5V5',
  ticket: 'M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v2a2 2 0 0 0 0 4v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-2a2 2 0 0 0 0-4v-2ZM14 7v10',
  cart: 'M3 4h2.2l2.3 11h10L20 7.5H6M9.5 20h.01M17 20h.01',
  stethoscope: 'M6 3v5a4 4 0 0 0 8 0V3M6 3H4.5M14 3h1.5M10 12v3a4.5 4.5 0 0 0 9 0v-2M19 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  music: 'M9 18V5.5l10-2V16M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM9 9.5l10-2',
  phone: 'M7.5 3.5h9a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5ZM10.5 17.5h3',
  briefcase: 'M3.5 8.5A1.5 1.5 0 0 1 5 7h14a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-10ZM9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17',
  bath: 'M4 12h16v2.5A4.5 4.5 0 0 1 15.5 19h-7A4.5 4.5 0 0 1 4 14.5V12ZM6 12V6.5A2.5 2.5 0 0 1 8.5 4c1 0 1.8.5 2.2 1.3M8 21v-2M16 21v-2M3 12h.01',
  dog: 'M5 10.5c0-2.5 2-4.5 4.5-4.5h5c2.5 0 4.5 2 4.5 4.5v3a4.5 4.5 0 0 1-4.5 4.5h-5A4.5 4.5 0 0 1 5 13.5v-3ZM7.5 6l-2-2.5M16.5 6l2-2.5M9 13h.01M15 13h.01M10.5 16h3',
  headphones: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v5H6a2 2 0 0 1-2-2v-1ZM18 14a2 2 0 0 0-2-2h-1v5h1a2 2 0 0 0 2-2v-1Z',
  yoga: 'M12 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 6v5M8 21l4-10 4 10M6 14l6-3 6 3',
  puzzle: 'M9 4.5h4v2a1.5 1.5 0 0 0 3 0v-2h4v4h-2a1.5 1.5 0 0 0 0 3h2v4h-4v-2a1.5 1.5 0 0 0-3 0v2H9v-4H7a1.5 1.5 0 0 1 0-3h2v-4Z',
  candle: 'M9 21h6M12 3s2 2.2 2 3.8a2 2 0 1 1-4 0C10 5.2 12 3 12 3ZM8 21v-8a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 13v8',
  run: 'M14.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM9 21l2-5-2-2 1-4.5L7 11M13 6l2.5 2.5-1 4 3.5 1.5-1 3',
  paint: 'M12 21a8.5 6.5 0 1 0 0-13 8.5 6.5 0 0 0 0 13ZM9 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM13 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  sparkle: 'M12 3.5 13.9 9.4 20 11.3 13.9 13.2 12 19.1 10.1 13.2 4 11.3 10.1 9.4 12 3.5Z',
  dot: 'M12 3.5 13.9 9.4 20 11.3 13.9 13.2 12 19.1 10.1 13.2 4 11.3 10.1 9.4 12 3.5Z',
}

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      style={{ flex: 'none' }}
    >
      <path d={P[name] ?? P.dot} />
    </svg>
  )
}

export const ACTIVITY_ICONS: IconName[] = [
  'bed',
  'sofa',
  'tree',
  'cup',
  'gamepad',
  'book',
  'train',
  'walk',
  'plate',
  'school',
  'user2',
  'users',
  'cake',
  'ticket',
  'cart',
  'stethoscope',
  'music',
  'phone',
  'briefcase',
  'bath',
  'dog',
  'headphones',
  'yoga',
  'puzzle',
  'candle',
  'run',
  'paint',
  'sparkle',
  'dot',
]
