-- Rolle und Pseudonym gegen Selbstbeförderung absichern.
--
-- Die bisherige Update-Regel auf profiles prüfte nur, dass jemand die eigene
-- Zeile bearbeitet – nicht, WELCHE Spalten. Damit konnte sich ein Proband
-- selbst rolle = 'researcher' setzen und anschließend über die Leseregeln die
-- Daten aller anderen Teilnehmenden einsehen.
--
-- In einer Regel lässt sich das nicht ausdrücken: RLS kennt im WITH CHECK nur
-- die neue Zeile, nicht die alte, kann also "hat sich rolle geändert?" nicht
-- prüfen. Deshalb ein Trigger, der beide Fassungen sieht.

create or replace function public.profil_kennzeichen_schuetzen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nur Zugriffe von Endnutzern werden eingeschränkt. Die Studienleitung
  -- vergibt die Forscherinnen-Rolle über das Supabase-Dashboard; dieses
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
    raise exception 'Die Rolle kann nicht selbst geändert werden.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.code is distinct from old.code then
    raise exception 'Der Studien-Code kann nicht geändert werden.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists profil_kennzeichen_schuetzen on public.profiles;
create trigger profil_kennzeichen_schuetzen
  before insert or update on public.profiles
  for each row execute function public.profil_kennzeichen_schuetzen();
