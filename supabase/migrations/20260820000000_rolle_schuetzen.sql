-- Rolle und Pseudonym gegen Selbstbefoerderung absichern.
--
-- Die bisherige Update-Regel auf profiles prueft nur, dass jemand die eigene
-- Zeile bearbeitet -- nicht, WELCHE Spalten. Damit konnte sich ein Proband
-- selbst rolle = 'researcher' setzen und anschliessend ueber die Leseregeln
-- die Daten aller anderen Teilnehmenden einsehen.
--
-- In einer Regel laesst sich das nicht ausdruecken: RLS kennt im WITH CHECK
-- nur die neue Zeile, nicht die alte, kann also "hat sich rolle geaendert?"
-- gar nicht pruefen. Deshalb ein Trigger, der beide Fassungen sieht.
--
-- Bewusst ohne Umlaute geschrieben, weil dieses Skript von Hand in den
-- SQL-Editor eingefuegt wird und dabei die Zeichenkodierung verloren gehen
-- kann.

create or replace function public.profil_kennzeichen_schuetzen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nur Zugriffe von Endnutzern werden eingeschraenkt. Die Studienleitung
  -- vergibt die Forscherinnen-Rolle ueber das Supabase-Dashboard; dieses
  -- arbeitet als service_role bzw. postgres und wird hier nicht gebremst.
  if current_role not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Ein selbst angelegtes Profil ist immer erst einmal Teilnehmer.
    new.rolle := 'participant';
    return new;
  end if;

  if new.rolle is distinct from old.rolle then
    raise exception 'Die Rolle kann nicht selbst geaendert werden.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.code is distinct from old.code then
    raise exception 'Der Studien-Code kann nicht geaendert werden.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists profil_kennzeichen_schuetzen on public.profiles;
create trigger profil_kennzeichen_schuetzen
  before insert or update on public.profiles
  for each row execute function public.profil_kennzeichen_schuetzen();
