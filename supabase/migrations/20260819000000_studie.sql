-- Sparflamme – Datenmodell für die Begleitstudie.
--
-- Grundgedanke: Probandinnen und Probanden melden sich mit einem pseudonymen
-- Code an (z. B. "SPF-04"); es werden bewusst keine Namen oder E-Mail-Adressen
-- gespeichert. Die Zuordnung Code -> Person liegt allein auf der
-- Teilnehmerliste der Studienleitung außerhalb dieses Systems.
--
-- Jede Tabelle ist per Row Level Security abgesichert: Teilnehmende sehen und
-- ändern ausschließlich eigene Zeilen, die Studienleitung darf alles lesen,
-- aber nichts verändern.

create type public.teilnehmer_rolle as enum ('participant', 'researcher');

-- ---------------------------------------------------------------- profiles --

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  code text not null unique,
  rolle public.teilnehmer_rolle not null default 'participant',
  -- App-Einstellungen (früher im localStorage)
  age int,
  status text not null default 'Schüler:in',
  sleep_start int not null default 1320,
  sleep_end int not null default 420,
  warn_threshold int not null default 25,
  stop_threshold int not null default 10,
  notifications_enabled boolean not null default false,
  check_in_display text not null default 'single',
  created_at timestamptz not null default now(),
  constraint code_format check (code ~ '^[A-Za-z0-9_-]{3,32}$')
);

-- ------------------------------------------------------------- activities --

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  icon text not null default 'sparkle',
  category text not null check (category in ('green', 'orange', 'red')),
  rate_per_30 numeric not null default 0,
  created_at timestamptz not null default now()
);
create index activities_user_idx on public.activities (user_id);

-- ----------------------------------------------------------------- events --

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  start_min int not null check (start_min between 0 and 1439),
  duration_min int not null check (duration_min > 0),
  activity_id uuid references public.activities on delete cascade,
  title text,
  note text,
  series_id uuid,
  created_at timestamptz not null default now()
);
create index events_user_date_idx on public.events (user_id, date);

-- --------------------------------------------------------------- check_ins --

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  slot text not null check (slot in ('morning', 'noon', 'evening')),
  level int not null check (level between 0 and 100),
  note text,
  created_at timestamptz not null default now(),
  -- Pro Tag und Tageszeit genau ein Eintrag; erneutes Erfassen überschreibt.
  unique (user_id, date, slot)
);
create index check_ins_user_date_idx on public.check_ins (user_id, date);

-- --------------------------------------------------------------- warnings --

create table public.warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  at timestamptz not null default now(),
  severity text not null check (severity in ('warn', 'stop')),
  signals text[] not null default '{}',
  -- Energielevel zum Zeitpunkt der Erfassung, für die Auswertung.
  level_at int
);
create index warnings_user_idx on public.warnings (user_id, at desc);

-- ------------------------------------------------------------------- RLS --

alter table public.profiles   enable row level security;
alter table public.activities enable row level security;
alter table public.events     enable row level security;
alter table public.check_ins  enable row level security;
alter table public.warnings   enable row level security;

-- Ist die aufrufende Person Studienleitung? Als SECURITY DEFINER, damit die
-- Abfrage nicht selbst wieder durch RLS läuft (sonst Endlosrekursion).
create or replace function public.ist_studienleitung()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rolle = 'researcher'
  );
$$;

-- profiles: eigenes Profil lesen/ändern, Studienleitung liest alle
create policy "eigenes profil lesen" on public.profiles
  for select using (id = auth.uid() or public.ist_studienleitung());
create policy "eigenes profil anlegen" on public.profiles
  for insert with check (id = auth.uid());
create policy "eigenes profil aendern" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Für alle Datentabellen dasselbe Muster.
create policy "eigene aktivitaeten lesen" on public.activities
  for select using (user_id = auth.uid() or public.ist_studienleitung());
create policy "eigene aktivitaeten schreiben" on public.activities
  for insert with check (user_id = auth.uid());
create policy "eigene aktivitaeten aendern" on public.activities
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene aktivitaeten loeschen" on public.activities
  for delete using (user_id = auth.uid());

create policy "eigene termine lesen" on public.events
  for select using (user_id = auth.uid() or public.ist_studienleitung());
create policy "eigene termine schreiben" on public.events
  for insert with check (user_id = auth.uid());
create policy "eigene termine aendern" on public.events
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene termine loeschen" on public.events
  for delete using (user_id = auth.uid());

create policy "eigene checkins lesen" on public.check_ins
  for select using (user_id = auth.uid() or public.ist_studienleitung());
create policy "eigene checkins schreiben" on public.check_ins
  for insert with check (user_id = auth.uid());
create policy "eigene checkins aendern" on public.check_ins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene checkins loeschen" on public.check_ins
  for delete using (user_id = auth.uid());

create policy "eigene warnsignale lesen" on public.warnings
  for select using (user_id = auth.uid() or public.ist_studienleitung());
create policy "eigene warnsignale schreiben" on public.warnings
  for insert with check (user_id = auth.uid());
create policy "eigene warnsignale loeschen" on public.warnings
  for delete using (user_id = auth.uid());

-- ------------------------------------------------- Profil bei Registrierung --

-- Legt beim Anlegen eines Auth-Nutzers automatisch das Profil an. Der Code
-- kommt aus den Metadaten der Registrierung.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, code)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'code', left(new.id::text, 8)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
