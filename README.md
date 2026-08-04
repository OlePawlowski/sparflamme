# Sparflamme

Web-App-Prototyp, um das eigene Energielevel im Alltag einzuschätzen, zu planen und im Blick zu behalten.
Zielgruppe: autistische Menschen, die Reizüberflutung früh erkennen und ihren Tag danach planen wollen.

Läuft als mobile Web-App (installierbar über „Zum Home-Bildschirm"), Daten liegen lokal im Browser.

## Starten

```bash
npm install && npm run dev
```

## Aufbau

Vier Tabs:

- **Heute** – aktuelles Energielevel als Batterie, Prognose für den Rest des Tages, Check-ins für morgens/mittags/abends, Warnsignale erfassen, Tagestermine.
- **Wochenplan** – Woche im Überblick, Termine und Agenda eintragen, besondere Ereignisse nachtragen.
- **Energiekurve** – Verlauf über Tag/Woche/Monat, Durchschnitt und Tiefpunkt, Auswertung welche Aktivitäten am meisten ziehen.
- **Profil** – Alter, Status, Schlafenszeitraum, Schwellwerte für Benachrichtigungen und der Aktivitätenkatalog in drei Bereichen (grün lädt auf, orange neutral, rot zieht Energie).

## Energiemodell

Jede Aktivität hat eine Wirkung in Prozentpunkten pro 30 Minuten. Der Tagesverlauf startet beim
Morgen-Check-in (sonst 100%), verrechnet die Termine minutenweise und rechnet außerhalb von Terminen
mit einem Grundverbrauch. Spätere Check-ins wirken als Messpunkte und setzen die Kurve auf den
tatsächlich gefühlten Wert zurück – der Rest des Tages wird von dort neu prognostiziert.

Alle Werte sind Startwerte und lassen sich im Profil an die eigene Erfahrung anpassen.

## Benachrichtigungen

- Unter dem Warnschwellwert (Standard 25%): *„Achte auf dein Energielevel"* – mit Vorschlag, welcher
  energieziehende Termin verschoben werden kann.
- Unter dem Abbruchschwellwert (Standard 10%): *„Brich deine Aktivität ab und ruh dich aus!"*
- Vorausschauend, wenn die Prognose innerhalb der nächsten zwei Stunden unter den Warnwert fällt.

Im Browser erscheinen sie als In-App-Banner; wenn im Profil aktiviert, zusätzlich als System-Push.

## Datenhaltung

Alles liegt in `localStorage` unter `sparflamme.v1`. Beim ersten Start werden Beispieldaten geladen,
zurücksetzen geht im Profil ganz unten.

## Stand

Prototyp zum Testen. Für den App Store fehlen: echtes Backend/Account, Hintergrund-Push
(Service Worker bzw. natives Wrapping über Capacitor), Kalender-Import und ein Datenschutzkonzept.
