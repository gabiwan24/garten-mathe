# Garten-Mathe – Design-Spec (Meilenstein 1)

Datum: 2026-10-06 · Status: vom Nutzer abschnittsweise freigegeben, Review der Spec ausstehend

## 1. Ziel & Zielgruppe

- Lern-App für ein Mädchen in der 2. Klasse (Bayern), das noch Mühe mit dem Mathe-Stoff der 1. Klasse hat.
- Kernproblem laut Fachdidaktik: **verfestigtes zählendes Rechnen**. Die App soll Zerlegen, verliebte Zahlen und den Zehnerübergang so trainieren, dass sie sich vom Zählen löst.
- Sie liest gut. Es gibt deshalb nur Text-Anweisungen, ohne Vorlesefunktion, dafür in großer Schrift.
- Zielgerät: **Android-Smartphone (Chrome), Hochformat, Touch**.

## 2. Rahmen

| Thema | Entscheidung |
|---|---|
| Plattform | PWA, installierbar über Chrome „App installieren“, offline nutzbar |
| Stack | Vite + Svelte 5 + TypeScript, `vite-plugin-pwa`, Vitest |
| Hosting | GitHub Pages (statisch, HTTPS). Öffentliches Repo = kostenlos |
| Speicherung | Nur lokal (localStorage), versioniertes Schema, Export/Import-Backup |
| Eltern | PIN-geschützter Elternbereich auf demselben Gerät |
| Entwicklung | `start.bat` mit freiem Port, erreichbar im Heim-WLAN zum Testen auf dem Handy |

## 3. Bau-Reihenfolge

- **Meilenstein 1 (diese Spec):**
  - Garten mit Pflanzengenerator und Neigen
  - Aufgaben **Zahlen zerlegen** (mit Schütteln), **Zehnerfeld auffüllen** und **Plus: bis 10 auffüllen**
  - Engine, Elternbereich, PWA
- **Spätere Meilensteine, je eine Gruppe:**
  - A: Blitzblick, Zahlenstrahl & Nachbarn
  - B: Herz-Paare finden, Pflanze korrigieren
  - C: Minus über die 10 zurück, Verdoppeln nutzen, Mit der 10 rechnen
  - D: Blitzrechnen 1+1 bis 20, Tausch- & Umkehraufgaben, „Wie hast du gerechnet?“

## 4. Architektur

Fünf Bausteine, jeder mit einem klaren Zweck:

| Modul | Zweck |
|---|---|
| `tasks/` | Pro Aufgabentyp ein **Generator** (erzeugt eine Aufgabe für eine Stufe 1–4) und eine **Ansicht** (zeigt sie an, meldet das Ergebnis). Alle Typen implementieren dieselbe Schnittstelle (`TaskType`) |
| `engine/` | Stellt Runden zusammen, verwaltet Stufen und Leitner-Fächer, entscheidet über Freischaltungen |
| `garden/` | Prozeduraler Pflanzengenerator (SVG), Garten-Übersicht, Neige-Animation |
| `store/` | Persistenz in localStorage, Schema-Version + Migrationen, letzte gültige Kopie, Export/Import |
| `parents/` | PIN, Statistik, Einstellungen, Backup |

**Ablauf:**
1. Garten öffnen.
2. „Weiter“ antippen oder ein Beet wählen.
3. Die Engine baut eine Runde mit 10 Aufgaben eines Typs.
4. Die Aufgaben-Ansicht läuft durch die Runde.
5. Das Ergebnis geht an die Engine (Stufen, Fächer, Statistik) und an den Garten (neue Pflanze).
6. Die neue Pflanze wird mit Animation eingepflanzt.

**Schnittstelle `TaskType` (Skizze):**
```ts
interface TaskType<T> {
  id: 'decompose' | 'fillTen' | 'addBridgeTen';
  family: PlantFamily;
  generate(level: 1 | 2 | 3 | 4, rng: Rng, focusItems: ItemKey[]): T;
  itemKey(task: T): ItemKey;            // e.g. "8+5", used for Leitner boxes
  component: SvelteComponent;           // emits { correctFirstTry, usedHelp, attempts, ms }
}
```

## 5. Look & Garten

**Stil:**
- Flache Scherenschnitt-Formen (Matisse-artig), ohne Verläufe und ohne Schatten.
- Referenz ist das vom Nutzer gelieferte Formen-Bild.
- Dieser Look ersetzt den Standard-Designstil.

**Palette (Annäherung an das Referenzbild):**

| Name | Hex |
|---|---|
| Grün | `#4E9A5B` |
| Rosa | `#F08C9A` |
| Gelb | `#F5B82E` |
| Blau | `#2F78C4` |
| Rot-Orange | `#E2522B` |
| Lila | `#9B87C4` |
| Creme | `#EADCB4` |
| Dunkelblau | `#23449A` |
| Oliv | `#93A62B` |
| Gold (nur Prachtpflanzen) | `#C9971E` + Glanzstreifen `#F3D57A` |

**Hintergrund (Natur, nicht schwarz), von oben nach unten:**
1. **Himmel** in hellem Creme-Blau, mit flacher gelber Sonne und 1–2 Creme-Wellenwolken.
2. **Wiese** in gedämpftem Salbeigrün mit Grasbüscheln (Stern-Form).
3. **Beete** als braune Erdflecken mit welligem Rand, eine Pflanze pro Beet. So stehen grüne Blätter nicht auf grüner Wiese.

**Garten-Übersicht:**
- Raster mit 4 Spalten, die neueste Pflanze unten, scrollbar.
- Tippt man auf eine Pflanze, erscheinen Datum, Aufgabentyp, Stufe und der Knopf **„Gießen“**. Er startet eine Runde desselben Typs.

### Prozeduraler Pflanzengenerator
- **Seed:** Jede Runde erzeugt einen Seed. Derselbe Seed ergibt immer dieselbe Pflanze. Gespeichert werden nur Seed, Familie und Stufe.
- **Bausteine:**
  - Stiel: gerade, gebogen oder gegabelt
  - Blätter: gelappt, korallenartig oder als Zweig
  - Krone: Blüte mit 5–8 Blütenblättern, Tulpe, Stern, Kirschen oder Zitrone/Birne mit Punkten
  - optionale Deko: Wellen oder Bogen
- **Organische Ränder:** Polarfunktion r(θ) = Basis + Σ Amplitude·sin(kθ + φ), die Punkte werden per Catmull-Rom zu einem glatten SVG-Pfad verbunden.
- **Farbregeln:**
  - Blätter: Grün, Blau oder Oliv
  - Krone: eine warme Kontrastfarbe (Rosa, Rot-Orange, Gelb oder Lila)
  - Mitte: Creme oder Orange
- **Familien pro Aufgabentyp:**

  | Aufgabentyp | Familie |
  |---|---|
  | Zerlegen | Blumen |
  | Zehnerfeld | Früchte |
  | Zehnerübergang | Korallen/Farne |

### Größe nach Rundenergebnis (nie Strafe)

| Ergebnis | Pflanze |
|---|---|
| unter 50 % | Stufe 2: kleiner Spross mit 2 Blättern |
| 50–79 % | Stufe 3: mittelgroß mit Blättern |
| 80–99 % | Stufe 4: groß mit **kleiner Blüte** |
| **genau 100 %** | **Prachtpflanze:** voll erblüht, mehrere Blüten oder Früchte, Biene oder Schmetterling, **ein goldenes Detail** (zufällig: Blütenmitte, ein Blatt, die Biene oder der Kronenrand), Einpflanz-Animation, kurze Vibration |

- **Prozentwert:** Anteil der Aufgaben, die **beim ersten Versuch und ohne Hilfe** richtig waren.
- **100 %** heißt: alle 10 Aufgaben so gelöst.
- **Gießen:** Eine Pflanze der Stufe 2–4 wächst um eine Stufe, höchstens bis **Stufe 5** (große, offene Blüte). Gießen macht nie eine Prachtpflanze.
- **Gieß-Runde:** Dabei wächst *nur* die gegossene Pflanze, es entsteht **keine** neue Pflanze. Jede normale Runde pflanzt genau eine neue Pflanze. Beide Arten zählen zum Tageslimit.
- Pflanzen schrumpfen und welken nie.
- Es gibt keine zufälligen Gold- oder Überraschungspflanzen.

### Neigen (Gyro)
- **Quelle:** `deviceorientation` (gamma). Unter Android Chrome ist keine Erlaubnis-Abfrage nötig.
- **Hierarchische Biegung:**
  - Jedes Element dreht sich um seinen eigenen Ansatzpunkt: Stielsegment am Segment darunter, Blatt am Stiel, Krone am Stielende, Blütenblatt an der Mitte.
  - Die Drehungen addieren sich nach oben, als verschachtelte SVG-`<g>`-Transforms.
- **Federmodell pro Element:**
  - Steifigkeit aus dem Seed: dicke Stiele steif, dünne Zweige weich.
  - Leichte Verzögerung nach oben, dadurch Nachschwingen.
  - Maximalwinkel etwa ±8° am Fuß.
- **Leistung:** Animiert werden nur sichtbare Pflanzen (IntersectionObserver) per `requestAnimationFrame`.
- **Aus,** wenn eine dieser Bedingungen zutrifft:
  - eine Aufgabe ist offen (der Effekt läuft nur in der Garten-Ansicht)
  - `prefers-reduced-motion` ist gesetzt
  - der Elternbereich hat ihn abgeschaltet
  - es gibt keinen Sensor

## 6. Aufgaben (Meilenstein 1)

### Gemeinsame Regeln
- **Eingabe:** eigene große Zahlentastatur (0–9, Löschen, OK), keine Auswahlknöpfe.
- **Stufen 1–4 (EIS-Prinzip):**

  | Stufe | Was sie sieht |
  |---|---|
  | 1 | Plättchen zum Ziehen |
  | 2 | Feld nur als Bild |
  | 3 | Bild 2 Sek. sichtbar |
  | 4 | nur Ziffern |

- **Erster Fehler:** „Fast! Schau mal…“, Hilfe am Feld einblenden, zweiter Versuch.
- **Zweiter Fehler:** Lösung schrittweise am Feld zeigen, die Aufgabe kommt später wieder (Leitner-Fach 1).
- Neutrale Farben, kein rotes ✗, keine Leben/Herzen, **kein sichtbarer Timer**.
- **Hilfe-Knopf** ist immer verfügbar. Die Benutzung zählt als „mit Hilfe“.
- Während der Aufgabe gibt es keine Animationen. Belohnungs-Animationen kommen erst danach.
- Lob gilt dem Rechenweg („Du hast zuerst die 10 voll gemacht!“), nie der Person („Du bist schlau“).

### 6.1 Zahlen zerlegen (Schüttelbox) – `decompose`
1. Eine Box mit Trennwand in der Mitte: „7 Plättchen sind drin. Schüttel!“
2. **Echtes Schütteln** des Handys (`devicemotion`, niedrige Schwelle). Die Plättchen fallen zufällig auf beide Seiten. Jedes Plättchen erzeugt ein leichtes Vibrations-„Klack“.
3. Ersatz: ein „Schütteln“-Knopf, wenn kein Sensor da ist.
4. Eine Seite bekommt einen Deckel. Frage: „Links sind 3. Wie viele sind unterm Deckel?“
5. Bewegung wird nur zu Beginn der Aufgabe ausgewertet, nicht während der Antwort.

- **Zahlenraum:**

  | Stufe | Gesamtzahl |
  |---|---|
  | 1 | 2–6 |
  | 2–4 | bis 10 |

- Plättchen werden in der 5er-Struktur angeordnet.
- **Hilfe:** Deckel auf, die versteckten Plättchen erscheinen als *Gruppe*, nicht einzeln.
- Fälle mit 0 auf einer Seite sind erlaubt, aber selten.

### 6.2 Zehnerfeld auffüllen (verliebte Zahlen) – `fillTen`
- Zehnerfeld (2×5) mit n Plättchen (n = 1–9): „Wie viele fehlen bis 10?“
- **Stufen:**
  - Stufe 1: Plättchen in leere Plätze ziehen erlaubt, die Zahl tippt sie trotzdem selbst ein.
  - Stufe 4: nur `6 + ? = 10`.
- **Bei richtig:** ein Herz mit „6 ❤ 4“.

### 6.3 Plus: bis 10 auffüllen – `addBridgeTen`
Am Zwanzigerfeld (2 Reihen à 10), geführt in 3 Schritten:
1. „Wie viele bis zur 10?“ (8 → 2)
2. „5 sind 2 und …?“ (→ 3)
3. „10 + 3 = ?“ (→ 13)

- **Darstellung:** Die Plättchen des zweiten Summanden füllen zuerst die erste Reihe auf, der Rest springt in die zweite Reihe.
- **Stufen:**
  - Stufe 1–2: alle Schritte geführt
  - Stufe 3: gefragt ist nur das Ergebnis, die Schritte gibt es über „Hilfe“
  - Stufe 4: nur Ziffern
- **Zahlenraum:**
  - Beide Summanden sind 2–9, der Zehner wird immer überschritten, das Ergebnis liegt bei 11–18.
  - Start mit großem erstem Summanden (8+5, 9+4), später gemischt (6+7).
- **Erster Versuch:** Eine geführte Aufgabe zählt nur dann als „beim ersten Versuch richtig“, wenn alle 3 Schritte beim ersten Versuch stimmen.
- **Freischaltung:** erst wenn `decompose` und `fillTen` jeweils mindestens Stufe 2 erreicht haben.

## 7. Engine

- **Runde:** 1 Aufgabentyp × 10 Aufgaben.
- **Startbildschirm:** großer **„Weiter“**-Knopf mit dem Vorschlag der Engine, dazu höchstens 3 Beete zur eigenen Wahl.
- **Vorschlag:** Bevorzugt wird der freigeschaltete Typ mit der niedrigsten Quote bzw. den meisten Aufgaben in Fach 1. Zwei Runden hintereinander mit demselben Typ werden vermieden, außer beim Gießen.
- **Stufenwechsel pro Typ:**
  - Aufstieg, wenn in den letzten 10 Aufgaben mindestens 85 % beim ersten Versuch und ohne Hilfe richtig waren
  - Abstieg bei unter 60 %
  - Stufe 1 und 4 sind die Grenzen.
- **In der Runde:** Nach 2 Fehlern hintereinander kommt eine leichtere Aufgabe (kleinere Zahlen). Die Stufe bleibt gleich.
- **Leitner:**
  - 5 Fächer pro `itemKey`.
  - Fehler: Fach 1. Richtig beim ersten Versuch ohne Hilfe: ein Fach weiter.
  - Die Auswahl gewichtet die unteren Fächer stärker.
- **Tageslimit:** Standard 3 Runden. Danach erscheint „Dein Garten wächst über Nacht 🌱“, und der Garten bleibt anschaubar. Die Zahl ist im Elternbereich einstellbar.
- **Antwortzeit:** wird gespeichert, aber nur im Elternbereich gezeigt.

## 8. Elternbereich

- **Zugang:** 2 Sekunden langer Druck auf ein kleines Zahnrad, dann eine 4-stellige PIN (beim ersten Start festgelegt). Kindersicher, keine echte Sicherheit.
- **Anzeige:**
  - pro Typ: Stufe, Quote beim ersten Versuch (letzte 10), Trend
  - Übungszeit pro Tag (14 Tage)
  - die 5 wackligsten Aufgaben, mit Gesprächstipp („Frag mal: Wie hast du 8+5 gerechnet?“)
- **Einstellungen:**
  - Runden pro Tag
  - Vibration an/aus
  - Neigen an/aus
  - Stufe pro Typ zurücksetzen
  - PIN ändern
- **Backup:** Export als JSON-Datei und Import mit Prüfung von Version und Schema.

## 9. Persistenz & Fehlerfälle

- **Gespeichert wird** ein einzelnes JSON-Objekt mit `schemaVersion`, Einstellungen, Stufen, Leitner-Fächern, Pflanzen (Seed, Familie, Stufe, Datum, Prachtflag) und Statistik.
- **Migrationen** laufen beim Start, von Version n auf n+1.
- **Vor jedem Schreiben** wird der vorige Stand als `lastGood` behalten. Ist der Hauptstand nicht lesbar, wird `lastGood` geladen.
- **Speicher voll oder gesperrt:** Die App läuft weiter (Stand im Speicher), dazu kommt ein Hinweis im Elternbereich.
- **Kein Bewegungssensor:** Schütteln über den Knopf, Pflanzen ohne Neigen.

## 10. Tests

- **Vitest:**
  - Generatoren: alle Aufgaben gültig über viele Seeds. `decompose` ≤ 10, `fillTen` ergibt 10, `addBridgeTen` überschreitet immer den Zehner mit Ergebnis 11–18.
  - Engine: Stufenwechsel an den Grenzen 85 % und 60 %, Leitner-Übergänge, Freischaltregel, Tageslimit.
  - Pflanzen: derselbe Seed ergibt dasselbe SVG, Gold nur bei Prachtpflanzen, Stufe ≤ 5 durch Gießen.
  - Store: Migration ohne Datenverlust, Wiederherstellung aus `lastGood`, Export und Import als Rundreise.
- **Manuell:**
  - auf dem Android-Handy über das Heim-WLAN (`start.bat`)
  - danach über GitHub Pages: installieren, offline starten, schütteln, neigen

## 11. Bewusst nicht enthalten

- Vorlesefunktion, Konten, Server-Sync, Ranglisten
- Timer, Leben/Herzen
- Zufalls-Belohnungen
- Gießen per Kippen
- iOS-Unterstützung

## Anhang: Recherche-Grundlagen (Kurzform)

- **Lehrplan:**
  - LehrplanPLUS Bayern, Mathematik Jgst. 1/2: https://www.lehrplanplus.bayern.de/fachlehrplan/grundschule/1/mathematik
  - Bayerischer Lernweg „Rechnen bis 20“ (Strategien: bis zur 10 / mit der 10 / Verdoppeln): https://www.brueckenbauen.bayern.de/fileadmin/user_upload/brueckenbauen/Lernstaende_einschaetzen/GS_Ma_1_2_Lernweg_Rechnen_bis_20.pdf
- **Zählendes Rechnen und Material:**
  - ISB/Gasteiger: zählendes Rechnen als Hauptsymptom, Material mit 5er- und 10er-Struktur: https://www.isb.bayern.de/fileadmin/user_upload/Grundschule/Handreichung_Rechnenlernen/isb_expertenbeitrag_gasteiger.pdf
  - PIKAS: Ablösung vom zählenden Rechnen, Blitzblick: https://pikas.dzlm.de
- **Wirksamkeit:**
  - Feedback (Hattie & Timperley 2007)
  - konkrete und halbkonkrete Darstellungen (WWC Practice Guide)
  - Lob für den Prozess (Mueller & Dweck 1998)
  - Mathe-Angst durch Zeitdruck (Ramirez 2013, Boaler)
- **Gamification:**
  - Überrechtfertigungseffekt (Deci/Koestner/Ryan 1999, Lepper 1973)
  - Protégé-Effekt
  - manipulative Designs in Kinder-Apps (Radesky 2022)
