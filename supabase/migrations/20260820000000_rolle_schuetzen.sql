-- Rolle und Pseudonym gegen Selbstbefoerderung absichern.
--
-- Die Update-Regel auf profiles prueft nur, WESSEN Zeile bearbeitet wird,
-- nicht WELCHE Spalten. Damit konnte sich ein Proband selbst
-- rolle = 'researcher' setzen und anschliessend ueber die Leseregeln die Daten
-- aller anderen Teilnehmenden einsehen.
--
-- In einer Regel laesst sich das nicht ausdruecken: RLS kennt im WITH CHECK
-- nur die neue Zeile, nicht die alte, kann also "hat sich rolle geaendert?"
-- gar nicht pruefen. Deshalb ein Trigger, der beide Fassungen sieht.
--
-- Unterschieden wird ueber auth.uid(), also den Token der Anfrage:
-- Endnutzer haben eine Kennung, das Dashboard und der SQL-Editor nicht.
-- Frueher stand hier current_role -- das war falsch, weil eine
-- SECURITY-DEFINER-Funktion den Eigentuemer meldet und nicht den Aufrufer,
-- wodurch der Trigger wirkungslos blieb. Die Funktion laeuft deshalb jetzt
-- auch als SECURITY INVOKER; erhoehte Rechte braucht sie nicht.
--
-- Bewusst ohne Umlaute, weil dieses Skript von Hand in den SQL-Editor
-- eingefuegt wird und dabei die Zeichenkodierung verloren gehen kann.

create or replace function public.profil_kennzeichen_schuetzen()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Kein Nutzertoken: Zugriff aus dem Dashboard oder dem SQL-Editor.
  -- Dort vergibt die Studienleitung die Forscherinnen-Rolle.
  if auth.uid() is null then
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

-- Aufraeumen: die Pruefkonten haben sich vor dieser Korrektur selbst die
-- Forscherinnen-Rolle gesetzt und teils fremde Codes genommen. Sie werden
-- ueber ihre Registrierungsadresse zurueckgestuft, nicht ueber den Code --
-- den konnten sie ja frei aendern. So kann diese Zeile kein echtes Konto
-- treffen, auch wenn das Skript spaeter erneut laeuft.
update public.profiles
set rolle = 'participant'
where id in (
  select id from auth.users
  where email like 'zztest-%@probanden.invalid'
);
