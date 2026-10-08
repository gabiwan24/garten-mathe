# Zaubergarten UI – Designsystem v1

Datum: 2026-10-08 · Umsetzung: `lab/zg.css` (Tokens + Komponenten), `lab/icons.js` (Symbole), geprüft von `lab/tests/design.check.mjs`

Dieses System gilt für alles, was das Kind sieht: Übungsbildschirm, Ergebniskarte, Gartentafel, Abschlusskarte, Tooltip an den Wegmarken. Ausnahmen: das Entwickler-Panel in `lab/blumenweg.html` und die Test-Seite `lab/schreiben.html`.
Es ersetzt für dieses Projekt bewusst das allgemeine Designsystem aus dem Skill `design-system` (eckige Kanten, Säure-Gelb): Gewünscht sind kindgerecht runde Formen und die Blumenfarben (Entscheidung steht in `docs/DECISIONS.md`).

## 1. Befund an der ersten Fassung („plump")
| Problem | Folge |
|---|---|
| Abstände 6/7/8/10/12/14/16/18 px gemischt | unruhig, kein Raster |
| Fünf Eckenradien (14/18/20/22/28 px) | wirkt zusammengewürfelt |
| Schriftgewicht 800 überall, dazu 3D-Schatten unter jedem Knopf | schwer und klobig |
| Zwei Karten übereinander (Aufgabe, Tastatur) und gestrichelte Rahmen | zu viele Kästen |
| Mehrere gleich laute Knöpfe, Emojis als Symbole | keine Rangfolge, uneinheitlich |
| Die Rückmeldezeile tauchte auf und verschob das Layout | Sprünge |
| Weiße Schrift auf Knöpfen in Gelb/Orange (Kontrast unter 4,5:1) | schlecht lesbar |

## 2. Grundregeln
1. **Eine Frage pro Bildschirm, eine Spalte** (max. 480 px, zentriert). Nichts steht nebeneinander außer Tasten und Punkten.
2. **Rangfolge der Elemente** (von laut nach leise):
   1. die Aufgabe (größte Schrift, Tintenfarbe)
   2. das Bild zur Aufgabe (Zahlenstrahl, Mauer; Punktebild nur als Hilfe)
   3. die Antwortfelder
   4. die Tasten
   5. die Rückmeldung (Lob oder Hinweis, Platz ist reserviert)
   6. Nebenaktionen (Hilfe, Schreiben/Tippen)
3. **Genau ein Hauptknopf pro Ansicht** (gefüllt in der Blumenfarbe). Alles andere ist ein Geisterknopf (nur Rand).
4. **Eine Karte pro Ansicht** (die Aufgabe). Eingabe liegt direkt auf dem Hintergrund, nicht in einer zweiten Karte.
5. **Flach statt klobig:** keine harten 3D-Schatten. Nur Karten schweben (ein weicher Schatten). Drücken zeigt sich durch leichtes Verkleinern (97 %) und hellere Fläche.
6. **Nichts springt:** Die Rückmeldezeile hat feste Mindesthöhe (2 Zeilen). Antwortfelder haben feste Größe. Erkanntes Ergebnis beim Schreiben steht im Schreibfeld, nicht in einer neuen Zeile.
7. **Keine Emojis, keine Zeichen aus Symbolschriften.** Nur einfarbige Linien-Symbole (SVG, Strichstärke 2, runde Enden) aus `icons.js`; dieselben Pfade werden auch auf die 3D-Wegmarken gezeichnet.
8. **Kein Zeitdruck:** keine Zeitanzeige, kein Verlust; Bewegungen dienen nur der Rückmeldung.

## 3. Tokens (alle in `lab/zg.css`)
**Abstände (4-px-Raster):** `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48.
Regel für den Rhythmus: innerhalb einer Gruppe 8–12, zwischen Gruppen 24, Bildschirmrand und Leiste 16.

**Radien:** `--r-1` 12 (Antwortfelder, Mauersteine) · `--r-2` 16 (Tasten, Tooltip) · `--r-3` 24 (Karten, Schreibfeld) · `--r-pill` (Knöpfe).

**Schrift (Nunito, nur zwei Gewichte 500 und 700):** `--t-1` 15 (Hinweis) · `--t-2` 18 (Text, Knöpfe) · `--t-3` 24 (Titel, Tastenziffern) · `--t-4` 32–44 (die Aufgabe).

**Größen:** Tippfläche `--size-tap` 48 · Taste `--size-key` 56 · Antwortfeld 48×60 · Punkte 10/14 · Randstärke `--bw` 2.

**Farben:** neutral `--ink` #1f2a44, `--ink-2` #4f5b78, `--white`. Aus der Blumenfarbe des Gartens (`--h`) abgeleitet: `--tint-1`/`--tint-2` (Hintergrund), `--line` (Rand), `--fill` (Hauptknopf), `--fill-down` (gedrückt, heller), `--accent` (Grafik: Kugel, Linie, aktiver Punkt), `--accent-ink` (farbiger Text), Punkte der Hilfe `--dot-a` (heller Blumenton) und `--dot-b` (dunkles Marineblau), `--star`.
Text steht immer in `--ink`, `--ink-2` oder `--accent-ink`, nie in einer hellen Blumenfarbe.

**Bewegung:** `--d-1` 120 ms (Rückmeldung), `--d-2` 240 ms, `--d-3` 360 ms (Erscheinen), Kurve `--ease`.

## 4. Bausteine
| Baustein | Regel |
|---|---|
| Hauptknopf | gefüllt `--fill`, Text `--ink`, Pille, 48 hoch; ein einziger je Ansicht |
| Geisterknopf | transparent, Rand `--line`, Text `--ink` |
| Symbolknopf | rund, 48, nur Symbol + `aria-label` |
| Taste | weiß, Rand `--line`, 56 hoch, Ziffer 24/700; Bestätigen-Taste gefüllt |
| Antwortfeld | ein Feld 104×60 für 1–2 Ziffern (verrät die Länge nicht), Rand `--line`, gefüllt: Rand `--accent` |
| Karte | weiß, Radius 24, weicher Schatten, Text mittig |
| Fortschritt | 5 Punkte à 10 px; erledigt `--fill`, aktuell `--accent` und 1,4-fach |
| Rückmeldung | `--accent-ink`, bei Hinweis `--ink`; Platz reserviert |
| Tabelle | Linien 1 px `--line`, Zellen 8/4 Abstand, Zahlen rechts mit gleich breiten Ziffern |
| Zahlenstrahl | Kugel über der Linie wird waagerecht gezogen, rastet beim Loslassen auf der nächsten Linie ein und setzt sich darauf; falsche Antwort → Kugel rollt zurück |
| Punkte-Hilfe | erste Zahl `--dot-a`, zweite `--dot-b`, Rest leer; erscheint nur über „Hilfe" |

## 5. Symbole
20 Linien-Symbole: close, help, keyboard, pen, check, backspace, star, house, heart, plus, minus, arrows, triangle, twice, compare, story, wave, tens, shuffle, square. Wegmarken-Themen: Herz = verliebte Zahlen, Plus, Minus, Quadrat = fehlende Zahl, Pfeile = Zahlenstrahl, Dreieck = Zahlenmauer, zwei Kreise = doppelt/halb, Winkel = vergleichen, Buch = Geschichte, Welle = Muster, Zehnerpunkte = Zehnerhilfe, Mischpfeile = Zaubermix.

## 6. Prüfung
`node lab/tests/design.check.mjs` prüft: keine rohen Pixelwerte bei Abständen, Radien, Schriftgrößen und Gewichten; Farben nur über Tokens; Abstände auf dem 4-px-Raster; keine Inline-Stile und keine Emojis/Symbolzeichen im Code; alle benutzten Symbole existieren; höchstens ein Hauptknopf je Vorlage; Rückmeldezeile mit reservierter Höhe; Kontrast jedes Textpaars (≥ 4,5:1, Stern ≥ 3:1) für alle 8 Gartenfarben. `lab/tests/colors.check.mjs` misst zusätzlich die beiden Punktfarben bei Farbsehschwächen.

## 7. Offen
- Dunkle Variante der Übungskarten gibt es nicht (Kind-Ansicht ist immer hell).
- Schreibfeld-Schriftgröße und Tastengröße auf einem echten Handy prüfen.
