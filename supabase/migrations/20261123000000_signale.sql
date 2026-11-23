-- Eigene Warnsignale je Teilnehmer.
--
-- Die Startliste stammt aus dem Konzept der Studienleitung. Reizueberflutung
-- kuendigt sich aber sehr unterschiedlich an, deshalb sollen Teilnehmende
-- eigene Signale ergaenzen koennen -- mit eigenem Piktogramm.
--
-- Die Tabelle warnings bleibt unveraendert: dort stehen weiterhin die Namen
-- der ausgewaehlten Signale als Text, nicht deren Kennungen. Ein spaeter
-- umbenanntes oder geloeschtes Signal verfaelscht damit keine alte Erfassung.
--
-- Bewusst ohne Umlaute, weil dieses Skript von Hand in den SQL-Editor
-- eingefuegt wird und dabei die Zeichenkodierung verloren gehen kann.

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  severity text not null check (severity in ('warn', 'stop')),
  icon text not null default 'alert',
  created_at timestamptz not null default now()
);

create index if not exists signals_user_idx on public.signals (user_id);

alter table public.signals enable row level security;

create policy "eigene signale lesen" on public.signals
  for select using (user_id = auth.uid() or public.ist_studienleitung());
create policy "eigene signale schreiben" on public.signals
  for insert with check (user_id = auth.uid());
create policy "eigene signale aendern" on public.signals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene signale loeschen" on public.signals
  for delete using (user_id = auth.uid());
