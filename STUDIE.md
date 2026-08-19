# Sparflamme – Einrichtung für die Begleitstudie

Diese Anleitung führt von null zu einer laufenden App in der Cloud, die auch
funktioniert, wenn kein Rechner von euch an ist. Rechne mit rund 30 Minuten.

Es gibt genau zwei Stellen, an denen ein Konto angelegt werden muss – das kann
nur ein Mensch tun, nicht der Rechner: Supabase (Datenbank) und Vercel
(Auslieferung der App).

---

## 1. Supabase-Projekt anlegen

1. Auf <https://supabase.com> registrieren und ein neues Projekt erstellen.
2. **Wichtig – Region:** `Central EU (Frankfurt)` wählen. Damit bleiben die
   Daten in der EU, was für Gesundheitsdaten nach DSGVO deutlich einfacher ist.
3. Ein starkes Datenbank-Passwort vergeben und im Passwortmanager ablegen.

### Schema einspielen

Im Supabase-Dashboard links auf **SQL Editor**, dann den kompletten Inhalt von
`supabase/migrations/20260819000000_studie.sql` einfügen und ausführen.

Das legt die Tabellen an und – wichtiger – die Zugriffsregeln:

* Teilnehmende sehen und ändern ausschließlich **eigene** Zeilen.
* Konten mit der Rolle `researcher` dürfen **alles lesen, aber nichts ändern**.

Diese Regeln laufen in der Datenbank, nicht in der App. Selbst wenn jemand die
App im Browser manipuliert, kommt er nicht an fremde Daten.

### E-Mail-Bestätigung abschalten

Unter **Authentication → Sign In / Providers → Email** den Schalter
*Confirm email* **aus**schalten.

Grund: Die Probanden melden sich mit einem Pseudonym-Code an, nicht mit einer
echten Adresse. Intern wird daraus `spf-04@probanden.invalid` – dorthin kann
keine Bestätigungsmail zugestellt werden.

---

## 2. Zugangsdaten in die App

Im Supabase-Dashboard unter **Project Settings → API** stehen zwei Werte.
Lege im Projektordner eine Datei `.env` an:

```
VITE_SUPABASE_URL=https://deinprojekt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Beide Werte sind öffentlich und landen im Browser – das ist vorgesehen. Der
Schutz kommt aus den Datenbankregeln.

> Der `service_role`-Key darf **niemals** in diese Datei oder in die App. Er
> umgeht sämtliche Sicherheitsregeln.

Ohne `.env` läuft die App im **Demo-Modus**: alles bleibt lokal im Browser,
keine Anmeldung, keine Auswertung. Praktisch zum Vorführen, ungeeignet für die
Studie.

---

## 3. Zugänge für die Studie anlegen

### Forscherinnen-Zugang

1. App starten, **Neuen Zugang anlegen** wählen, z. B. Code `LEITUNG` mit einem
   starken Passwort.
2. In Supabase unter **Table Editor → profiles** die Zeile heraussuchen und
   `rolle` von `participant` auf `researcher` ändern.
3. Neu anmelden – jetzt erscheint statt der App das Dashboard.

### Probanden-Zugänge

Zwei Möglichkeiten:

* **Selbst registrieren:** Du gibst jeder Person ihren Code (`SPF-01` bis
  `SPF-10`) und sie vergibt beim ersten Öffnen ihr eigenes Passwort. Empfohlen,
  weil du das Passwort dann nie kennst.
* **Vorab anlegen:** Du registrierst alle Zugänge selbst und gibst Code plus
  Passwort aus.

Führe die Zuordnung Code → Person **auf Papier oder in einer getrennten Datei**,
niemals in der App. Genau darin liegt der Datenschutzgewinn: In der Datenbank
steht kein Name.

---

## 4. App ins Netz stellen

1. Auf <https://vercel.com> mit dem GitHub-Konto anmelden.
2. **Add New → Project** und das Repository `sparflamme` auswählen.
3. Vercel erkennt Vite automatisch. Unter **Environment Variables** die beiden
   Werte aus Schritt 2 eintragen (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. **Deploy**.

Danach läuft die App unter einer festen Adresse, unabhängig von euren Rechnern.
Jeder Push auf `main` veröffentlicht automatisch neu.

Die Probanden öffnen die Adresse am Handy und legen sie über *Teilen → Zum
Home-Bildschirm* ab. Dann verhält sie sich wie eine installierte App.

---

## 5. Vor dem Studienstart prüfen

- [ ] Zwei Testzugänge anlegen, mit beiden Daten erfassen.
- [ ] Mit Zugang A anmelden und sicherstellen, dass die Daten von B **nicht**
      sichtbar sind.
- [ ] Mit dem Forscherinnen-Zugang beide im Dashboard sehen.
- [ ] Alle vier CSV-Dateien herunterladen und in Excel bzw. SPSS öffnen.
- [ ] Testzugänge in Supabase unter **Authentication → Users** löschen –
      die Daten verschwinden automatisch mit.

---

## Datenschutz – was ihr noch braucht

Die App ist technisch auf Datensparsamkeit ausgelegt: keine Namen, keine
E-Mail-Adressen, keine Standortdaten, keine Tracker, Server in Frankfurt.

Das ersetzt aber nicht:

* **Ethikvotum** der Hochschule – bei Gesundheitsdaten und einer vulnerablen
  Gruppe in aller Regel verpflichtend.
* **Einwilligungserklärung** der Teilnehmenden, bei Minderjährigen zusätzlich
  der Erziehungsberechtigten.
* **Auftragsverarbeitungsvertrag** mit Supabase – über das Dashboard abrufbar.
* **Löschkonzept**: Wann werden die Daten nach Studienende gelöscht? Ein Konto
  in Supabase zu löschen entfernt alle zugehörigen Daten mit.

Das ist Sache der Studienleitung, nicht der App.
