import {
  Activity, Armchair, Baby, Banknote, Bath, Bed, Bike, Bird, BookOpen, Brain, Briefcase, Bus,
  Cake, Calculator, Camera, Car, Cat, ChefHat, Church, Clapperboard, ClipboardList, Clock,
  CloudRain, CloudSun, Coffee, Dog, Drama, Dumbbell, Ear, Fish, Flame, Flower2, Footprints,
  Gamepad2, Glasses, GraduationCap, Guitar, HeartHandshake, HeartPulse, Headphones, Home, Laptop,
  Leaf, Library, Luggage, MessageCircle, Moon, Mountain, Music, Palette, PartyPopper, PenTool,
  PencilLine, PersonStanding, Phone, Piano, Pill, Plane, Presentation, Puzzle, Radio, Sailboat,
  Scissors, ShoppingCart, Shirt, Smartphone, Snowflake, Sofa, Sparkles, Sprout, Stethoscope,
  Store, Sun, Sunrise, Sunset, Syringe, Tent, Thermometer, Ticket, Trash2, TrainFront, TreePine,
  Trees, Tv, User, Users, Utensils, Video, Volume2, Wallet, WashingMachine, Waves, Wind, Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Symbole für Aktivitäten, gruppiert für die Auswahl.
 *
 * Der Schlüssel wird in der Datenbank gespeichert, nicht das Symbol selbst.
 * Deshalb dürfen bestehende Schlüssel nie verschwinden – siehe ALTE_NAMEN.
 */
export const ICON_GRUPPEN: { titel: string; icons: { name: string; label: string; C: LucideIcon }[] }[] = [
  {
    titel: 'Ruhe und Erholung',
    icons: [
      { name: 'bed', label: 'Schlafen', C: Bed },
      { name: 'sofa', label: 'Ausruhen', C: Sofa },
      { name: 'armchair', label: 'Sessel', C: Armchair },
      { name: 'bath', label: 'Baden', C: Bath },
      { name: 'cup', label: 'Tee oder Kaffee', C: Coffee },
      { name: 'moon', label: 'Abend', C: Moon },
      { name: 'sunrise', label: 'Morgen', C: Sunrise },
      { name: 'sunset', label: 'Sonnenuntergang', C: Sunset },
      { name: 'candle', label: 'Kerze', C: Flame },
      { name: 'tent', label: 'Rückzug', C: Tent },
    ],
  },
  {
    titel: 'Draußen und Bewegung',
    icons: [
      { name: 'walk', label: 'Spazieren', C: Footprints },
      { name: 'run', label: 'Laufen', C: PersonStanding },
      { name: 'bike', label: 'Fahrrad', C: Bike },
      { name: 'yoga', label: 'Dehnen', C: Activity },
      { name: 'dumbbell', label: 'Sport', C: Dumbbell },
      { name: 'waves', label: 'Schwimmen', C: Waves },
      { name: 'mountain', label: 'Wandern', C: Mountain },
      { name: 'tree', label: 'Natur', C: TreePine },
      { name: 'trees', label: 'Wald', C: Trees },
      { name: 'flower', label: 'Garten', C: Flower2 },
      { name: 'sprout', label: 'Pflanzen', C: Sprout },
      { name: 'leaf', label: 'Blatt', C: Leaf },
      { name: 'sun', label: 'Sonne', C: Sun },
      { name: 'cloudsun', label: 'Wetter', C: CloudSun },
      { name: 'rain', label: 'Regen', C: CloudRain },
      { name: 'wind', label: 'Wind', C: Wind },
      { name: 'snow', label: 'Schnee', C: Snowflake },
      { name: 'sailboat', label: 'Boot', C: Sailboat },
    ],
  },
  {
    titel: 'Alltag und Wege',
    icons: [
      { name: 'home', label: 'Zuhause', C: Home },
      { name: 'cart', label: 'Einkaufen', C: ShoppingCart },
      { name: 'store', label: 'Laden', C: Store },
      { name: 'plate', label: 'Essen', C: Utensils },
      { name: 'chefhat', label: 'Kochen', C: ChefHat },
      { name: 'washing', label: 'Wäsche', C: WashingMachine },
      { name: 'trash', label: 'Aufräumen', C: Trash2 },
      { name: 'shirt', label: 'Anziehen', C: Shirt },
      { name: 'wrench', label: 'Reparieren', C: Wrench },
      { name: 'car', label: 'Auto', C: Car },
      { name: 'bus', label: 'Bus', C: Bus },
      { name: 'train', label: 'Bahn', C: TrainFront },
      { name: 'plane', label: 'Flugzeug', C: Plane },
      { name: 'luggage', label: 'Reise', C: Luggage },
      { name: 'wallet', label: 'Geld', C: Wallet },
      { name: 'banknote', label: 'Bezahlen', C: Banknote },
      { name: 'clock', label: 'Termin', C: Clock },
    ],
  },
  {
    titel: 'Schule und Arbeit',
    icons: [
      { name: 'school', label: 'Schule', C: GraduationCap },
      { name: 'book', label: 'Lernen', C: BookOpen },
      { name: 'library', label: 'Bibliothek', C: Library },
      { name: 'briefcase', label: 'Arbeit', C: Briefcase },
      { name: 'laptop', label: 'Computer', C: Laptop },
      { name: 'pencil', label: 'Schreiben', C: PencilLine },
      { name: 'calculator', label: 'Rechnen', C: Calculator },
      { name: 'presentation', label: 'Vortrag', C: Presentation },
      { name: 'clipboard', label: 'Aufgaben', C: ClipboardList },
    ],
  },
  {
    titel: 'Menschen',
    icons: [
      { name: 'user2', label: 'Eine Person', C: User },
      { name: 'users', label: 'Mehrere Menschen', C: Users },
      { name: 'message', label: 'Gespräch', C: MessageCircle },
      { name: 'phone', label: 'Telefonieren', C: Phone },
      { name: 'video', label: 'Videoanruf', C: Video },
      { name: 'party', label: 'Feier', C: PartyPopper },
      { name: 'cake', label: 'Geburtstag', C: Cake },
      { name: 'heart', label: 'Nähe', C: HeartHandshake },
      { name: 'baby', label: 'Kind', C: Baby },
      { name: 'dog', label: 'Hund', C: Dog },
      { name: 'cat', label: 'Katze', C: Cat },
      { name: 'bird', label: 'Vogel', C: Bird },
      { name: 'fish', label: 'Fisch', C: Fish },
      { name: 'church', label: 'Gemeinde', C: Church },
    ],
  },
  {
    titel: 'Gesundheit',
    icons: [
      { name: 'stethoscope', label: 'Arzttermin', C: Stethoscope },
      { name: 'pill', label: 'Medikamente', C: Pill },
      { name: 'syringe', label: 'Impfung', C: Syringe },
      { name: 'heartpulse', label: 'Körper', C: HeartPulse },
      { name: 'brain', label: 'Kopf', C: Brain },
      { name: 'ear', label: 'Hören', C: Ear },
      { name: 'glasses', label: 'Sehen', C: Glasses },
      { name: 'thermometer', label: 'Krank', C: Thermometer },
    ],
  },
  {
    titel: 'Medien und Reize',
    icons: [
      { name: 'headphones', label: 'Kopfhörer', C: Headphones },
      { name: 'music', label: 'Musik', C: Music },
      { name: 'volume', label: 'Lautstärke', C: Volume2 },
      { name: 'radio', label: 'Radio', C: Radio },
      { name: 'tv', label: 'Fernsehen', C: Tv },
      { name: 'film', label: 'Film', C: Clapperboard },
      { name: 'gamepad', label: 'Spielen', C: Gamepad2 },
      { name: 'smartphone', label: 'Handy', C: Smartphone },
      { name: 'zap', label: 'Reizüberflutung', C: Zap },
    ],
  },
  {
    titel: 'Kreativ und Freizeit',
    icons: [
      { name: 'paint', label: 'Malen', C: Palette },
      { name: 'camera', label: 'Fotografieren', C: Camera },
      { name: 'guitar', label: 'Gitarre', C: Guitar },
      { name: 'piano', label: 'Klavier', C: Piano },
      { name: 'pen', label: 'Gestalten', C: PenTool },
      { name: 'scissors', label: 'Basteln', C: Scissors },
      { name: 'puzzle', label: 'Puzzle', C: Puzzle },
      { name: 'drama', label: 'Theater', C: Drama },
      { name: 'ticket', label: 'Veranstaltung', C: Ticket },
      { name: 'sparkle', label: 'Sonstiges', C: Sparkles },
    ],
  },
]

/**
 * Schlüssel, die vor der Umstellung auf Lucide vergeben wurden und in
 * bestehenden Einträgen stehen. Sie zeigen auf das jeweils nächstliegende
 * neue Symbol, damit alte Aktivitäten nicht ohne Symbol dastehen.
 */
const ALTE_NAMEN: Record<string, LucideIcon> = {
  gamepad: Gamepad2,
  dot: Sparkles,
  sofa: Sofa,
  bed: Bed,
  tree: TreePine,
  cup: Coffee,
  book: BookOpen,
  train: TrainFront,
  walk: Footprints,
  plate: Utensils,
  school: GraduationCap,
  users: Users,
  user2: User,
  cake: Cake,
  ticket: Ticket,
  cart: ShoppingCart,
  stethoscope: Stethoscope,
  music: Music,
  phone: Phone,
  briefcase: Briefcase,
  bath: Bath,
  dog: Dog,
  headphones: Headphones,
  yoga: Activity,
  puzzle: Puzzle,
  candle: Flame,
  run: PersonStanding,
  paint: Palette,
  sparkle: Sparkles,
}

const NACH_NAME: Record<string, LucideIcon> = {
  ...ALTE_NAMEN,
  ...Object.fromEntries(ICON_GRUPPEN.flatMap((g) => g.icons.map((i) => [i.name, i.C]))),
}

/** Nie leer: unbekannte Schlüssel bekommen ein neutrales Symbol. */
export function aktivitaetsIcon(name: string | undefined): LucideIcon {
  return (name && NACH_NAME[name]) || Sparkles
}

export const ALLE_ICON_NAMEN = ICON_GRUPPEN.flatMap((g) => g.icons.map((i) => i.name))
