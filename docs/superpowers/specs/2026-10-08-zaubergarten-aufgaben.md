# Zaubergarten – Aufgaben, Oberfläche, Handschrift, Finale (Konzept)

Datum: 2026-10-08 · Status: Prototyp in `lab/` lauffähig (`lab/blumenweg.html`), noch nicht in die Svelte-App übernommen

## 1. Idee in einem Satz
Der Zaubergarten schläft im Dunkeln. Jede geübte Aufgabe lässt eine Wegmarke leuchten und Blumen wachsen. Vier Gärten führen zum Hexenhäuschen am Ende des Weges.

## 2. Regeln für 7-Jährige (nicht brechen)
- Kurze Sätze, große Schrift. Es gibt **keine Vorlesefunktion** (wie in der ersten Spec; ein kurzer Prototyp mit Vorlesen wurde auf Wunsch wieder entfernt).
- Keine sichtbaren Timer, keine Leben, keine Ranglisten. **Bestwerte** sind persönlich (eigene Bestleistung), kein Vergleich mit anderen.
- Gelobt wird das Üben („Du hast drangeblieben!"), nicht die Zahl. Pflanzen und Bestwerte schrumpfen nie.
- Eine Sitzung = ein Garten (8 Übungen). Aufhören ist jederzeit möglich; der Weg wartet.
- Beim Üben deckt die Oberfläche den Garten komplett ab (keine Ablenkung), in den Farben der Blumen des jeweiligen Gartens.

## 3. Aufbau
- **32 Wegmarken = 4 Gärten × 8.** Jede Marke ist eine Übung mit **5 Fragen** (ca. 2 Minuten).
- **Themen sind gemischt** (kein Garten = ein Thema). Jeder Garten enthält Plus und Minus sowie weitere Themen; die Schwierigkeit (Stufe 1–4) steigt mit dem Garten. Das Symbol auf der Marke verrät das Thema (Herz = verliebte Zahlen, Plus, Minus, Quadrat = fehlende Zahl, Pfeile = Zahlenstrahl, Dreieck = Zahlenmauer, zwei Kreise = doppelt/halb, Winkel = vergleichen, Buch = Geschichte, Welle = Muster, Zehnerpunkte = Zehnerhilfe, Mischpfeile = Zaubermix).
- Mindestniveau: **jede Rechenaufgabe enthält mindestens eine Zahl ≥ 10, meist bis 20** (kein „links sind 0, wie viele rechts?"). Der Test `lab/tests/tasks.test.mjs` erzwingt das.
- **Wertung pro Frage:** 20 Punkte beim ersten Versuch ohne Hilfe, 12 mit Hilfe oder nach einem Fehler, 6 wenn die Lösung gezeigt werden musste. Fünf Fragen = 10 bis 100 Punkte (nie unter 10). Die Punktzahl steuert Menge, Länge, Kopfgröße und Farbe der Blumen und die Punkte auf der Marke (1–4 Punkte, bei 100 der Stern).
- **Bestwerte:** pro Marke Bestwert, letzter Wert, Anzahl der Runden. Nach jedem Tor erscheint die **Gartentafel** (8 Zeilen, Gesamtsumme von 800, Sterne). Sie ist später jederzeit durch Antippen des Tors abrufbar.
- Gespeichert wird lokal (`localStorage`, Schlüssel `zg_lab_state`).

## 4. Themenplan

**Garten 1 · Kugelwiese (Stufe 1)**

| # | Symbol | Thema | Eingabe |
|---|---|---|---|
| 1 | Herz | Verliebte Zahlen | Finger schreibt |
| 2 | Plus | Plusaufgaben | Tastatur / Antippen |
| 3 | Pfeile | Zahlenstrahl | Tastatur / Antippen |
| 4 | Dreieck | Zahlenmauer | Finger schreibt |
| 5 | Minus | Minusaufgaben | Tastatur / Antippen |
| 6 | zwei Kreise | Doppelt und halb | Tastatur / Antippen |
| 7 | Welle | Zahlenmuster | Finger schreibt |
| 8 | Buch | Gartengeschichten | Tastatur / Antippen |

**Garten 2 · Tulpengarten (Stufe 2)**

| # | Symbol | Thema | Eingabe |
|---|---|---|---|
| 9 | Plus | Plusaufgaben | Tastatur / Antippen |
| 10 | Herz | Verliebte Zahlen | Tastatur / Antippen |
| 11 | Quadrat | Welche Zahl fehlt? | Finger schreibt |
| 12 | Minus | Minusaufgaben | Tastatur / Antippen |
| 13 | Winkel | Größer oder kleiner? | Tastatur / Antippen |
| 14 | Dreieck | Zahlenmauer | Finger schreibt |
| 15 | Pfeile | Zahlenstrahl | Tastatur / Antippen |
| 16 | Auge | Wie viele Punkte? (Zwanzigerfeld sichtbar) | Tastatur / Antippen |

**Garten 3 · Margeriten-Hain (Stufe 3)**

| # | Symbol | Thema | Eingabe |
|---|---|---|---|
| 17 | Minus | Minusaufgaben | Tastatur / Antippen |
| 18 | zwei Kreise | Doppelt und halb | Finger schreibt |
| 19 | Zehnerpunkte | Mit der 10 rechnen | Tastatur / Antippen |
| 20 | Plus | Plusaufgaben | Tastatur / Antippen |
| 21 | Quadrat | Welche Zahl fehlt? | Finger schreibt |
| 22 | Pfeile | Zahlenstrahl | Tastatur / Antippen |
| 23 | Buch | Gartengeschichten | Tastatur / Antippen |
| 24 | Tauschpfeile | Aufgabenfamilie (Tausch- und Umkehraufgabe) | Finger schreibt |

**Garten 4 · Glockental (Stufe 4)**

| # | Symbol | Thema | Eingabe |
|---|---|---|---|
| 25 | Herz | Verliebte Zahlen | Finger schreibt |
| 26 | Dreieck | Zahlenmauer | Tastatur / Antippen |
| 27 | Plus | Plusaufgaben | Tastatur / Antippen |
| 28 | Minus | Minusaufgaben | Finger schreibt |
| 29 | Winkel | Größer oder kleiner? | Tastatur / Antippen |
| 30 | Quadrat | Welche Zahl fehlt? | Tastatur / Antippen |
| 31 | Buch | Gartengeschichten | Finger schreibt |
| 32 | Mischpfeile | Zaubermix | Tastatur / Antippen |

## 5. Aufgabentypen und Stufen
| Typ | Stufe 1 | Stufe 2 | Stufe 3 | Stufe 4 |
|---|---|---|---|---|
| ♥ Verliebte Zahlen | 7 + □ = 10 | 14 + □ = 20 | Zwei Schritte: 7+□=10, dann 17+□=20 | □ + 8 = 20, 15 + □ = 20 |
| + Plus | 14 + 3 (ohne Brücke) | 8 + 6 geführt (zur 10, Rest, Summe) | 9 + 7 direkt, 13 + 7 | 7 + 6 + 3 (verliebtes Paar), 8 + 9 |
| − Minus | 17 − 5 | 14 − 6 geführt | 15 − 8 direkt | 18 − 4 − 5, 20 − 7 |
| □ fehlt | 6 + □ = 13 | □ + 9 = 17 | □ − 6 = 9, 14 − □ = 8 | 5 + □ = 7 + 6 |
| ↔ Zahlenstrahl | Tippe auf 14 | Start 8, hüpfe 5 | Vorgänger/Nachfolger | Mitte von 8 und 14 |
| ▲ Zahlenmauer | 6, 7 → ? | Drei Steine unten, drei Schritte | Ein Stein unten fehlt | Zwei Steine unten fehlen |
| 2× doppelt/halb | 8 + 8 | Hälfte von 16 | 7 + 8 über 7 + 7 + 1 | 9 + 9 − 3 |
| <> vergleichen | 14 ○ 17 | 8 + 7 ○ 14 | 9 + 6 ○ 7 + 9 | 15 − 6 ○ 4 + 5 |
| ✎ Geschichte | Zusammen | Weg | Fehlt bis 20 | Zwei Schritte |
| ∿ Muster | 4, 6, 8, □ | 20, 15, 10, □ | 3, 7, 11, □ | 1, 2, 4, 7, □ |
| 10 Zehnerhilfe | 10 + 7 | 17 − 10 | 20 − 10 + 5 | (14 − 4) + 7 |

## 6. Oberfläche (leicht, ablenkungsfrei)
- Vollbild-Karte über dem Garten, in den Blumenfarben der Marke; alle Regeln im Designsystem `2026-10-08-zaubergarten-designsystem.md`. Keine Emojis, nur einfarbige Linien-Symbole.
- Eingaben: Zifferntastatur, Antippen (Vergleichszeichen), Ziehen einer Kugel auf die richtige Linie (Zahlenstrahl) und **Schreiben mit dem Finger** (rund ein Drittel der Übungen; „Lieber tippen" ist immer erreichbar).
- Fehler: erster Fehler → freundlicher Hinweis und Bild-Hilfe; zweiter Fehler → Lösung mit Erklärung, weiter. Der Knopf „Hilfe" zeigt ein Bild (Zehnerfeld) oder einen Tipp; Bilder mit Lösungshinweis erscheinen nie ungefragt.
- Töne: weiche Töne bei richtigen Antworten, steigende Klangfolge beim Aufleuchten der Marken, Fanfare; Hintergrundmusik leise mit Ein- und Ausblenden.

## 7. Tor, Feuerwerk, Hexenhäuschen
- Ist die letzte Übung eines Gartens geschafft, leuchten die Marken **von unten nach oben** nacheinander auf (Klang steigt), dann öffnet sich das Tor mit Glitzerstaub und ca. 10 Schmetterlingen; danach erscheint die Gartentafel.
- Nach dem vierten Tor: **großes Feuerwerk** (ca. 14 Sekunden, Blumenfarben, steigernd, Schlusssalve), danach Gartentafel und Abschlusskarte „Gartenmeister!" mit allen vier Gärten.
- Am Ende des Weges steht ein kleines Hexenhäuschen (rundes Haus, schiefer lila Hut, Fenster, Schornsteinrauch, Kürbis, Pilze, Kessel, Laterne). Sein Licht wird stärker, wenn alle 32 Marken geschafft sind.
- Um den Pfeil der nächsten Aufgabe schwirren Glühwürmchen.

## 8. Handschrift mit dem Finger – System und Machbarkeit
**System (`lab/ink.js`, reines JavaScript ohne Bibliotheken):**
1. Striche sammeln (Pointer-Events), nach 1,1 s Pause oder „Fertig" auswerten.
2. Zerlegen in Ziffern: Striche mit überlappenden x-Bereichen gehören zu einer Ziffer, eine deutliche Lücke beginnt die nächste.
3. Jede Ziffer wird per **Punktwolken-Vergleich** gegen mehrere Vorlagen pro Ziffer geprüft (unabhängig von Strichreihenfolge und -richtung, weil Kinder Striche in beliebiger Reihenfolge schreiben).
4. **Erwartungsbewusst:** Gefragt wird nicht „welche Zahl ist das?", sondern „ist das die erwartete Zahl?". Falsche Zahlen werden fast nie akzeptiert; bei Unsicherheit fragt die App „Meinst du 7?" oder bittet um noch einmal schreiben – nie als Fehler gewertet.
5. Immer verfügbar: „Lieber tippen".

**Messung** (synthetische, bewusst unsaubere Handschrift mit eigenen Schreibstilen, deterministisch; `node lab/tests/ink.test.mjs`):

| Messwert | leicht | mittel | stark krakelig |
|---|---|---|---|
| Ziffer richtig (Top-1) | 99,5 % | 96,9 % | 89,5 % |
| Ziffer in den Top-2 | 100,0 % | 99,7 % | 96,5 % |
| Zahl 10–20 richtig | 98,2 % | 89,3 % | 66,4 % |
| Richtige Antwort akzeptiert | 98,1 % | 87,9 % | 67,0 % |
| Falsche Antwort fälschlich akzeptiert | 0,1 % | 0,5 % | 0,8 % |
| Zeit pro Erkennung (Desktop) | 3,5 ms | 3,1 ms | 3,0 ms |

**Bewertung:** Machbar. Bei lesbarer Schrift ist die Erkennung zuverlässig, und der erwartungsbewusste Vergleich macht „falsch akzeptiert" praktisch unmöglich (unter 1 %). Bei sehr krakeliger Schrift sinkt die Annahmequote auf ca. 67 %; dann greift die Rückfrage, sodass das Kind nicht bestraft wird. Die 9 wird bei mittlerer Schrift in 97 % erkannt (Verwechslung mit 5 und 3 je unter 3 %, meist wird sie mit 1 verwechselt); die echte Fehlerquelle ist umgekehrt 5→9 (9 % mittel, 21 % stark), weil die Schreibrichtung nicht ausgewertet wird. Typische Verwechslungen: 7↔1 (schräge 7 mit kurzem Balken), 5↔9, eine dünne 1 neben 0 oder 3 geht in zweistelligen Zahlen verloren; durchgehend verbunden geschriebene Ziffern werden nicht getrennt. **Grenze der Messung:** Es sind synthetische Daten aus einem selbst geschriebenen Schreiber; die 0,5 % Falsch-Annahme sind für echte Kinderschrift wahrscheinlich zu optimistisch. Die Schwellen für „annehmen" und „unsicher" wurden an diesen Daten gesetzt. Empfehlung: Mit `lab/schreiben.html` echte Proben sammeln („Probe speichern" / „Exportieren") und Vorlagen und Schwellen daran nachjustieren, bevor die Funktion fest in die App kommt.

**Empfohlene Verbesserungen (noch nicht eingebaut):** ein eigenes Kästchen pro Ziffer bei zweistelligen Antworten (entfernt die Trennfehler komplett), Bestätigungsschritt bei verwechselbaren Paaren (1/7, 5/9, 0/6, 3/8), blasse Schreibhilfe für 1, 7 und 5, Mindestgröße der Schrift (etwa ein Drittel der Schreibfläche).

## 9. Offene Punkte
- Echte Kinderschrift messen und nachjustieren (siehe oben); danach Kästchen pro Ziffer und Bestätigungsschritt für verwechselbare Paare einbauen.
- Prototyp (`lab/`) in die Svelte-App übernehmen: Generatoren in `src/tasks/` (bestehendes `TaskGenerator`-Muster), Fortschritt in den bestehenden Store, Szene als Komponente.
- Die bisherigen App-Aufgaben (Zerlegen bis 10, Zehnerfeld) bleiben als leichte Stufe 0 erhalten.

**Menü und Name:** Zwei runde Knöpfe oben rechts: Ton an/aus (immer sichtbar, Zustand wird gemerkt) und Menü für Erwachsene (Name ändern, alle Bestwerte; Entwickler-Regler und Fortschritt löschen erscheinen erst nach 4 Tippen auf das Wort „Erwachsene“, löschen braucht ein zweites Tippen). Beim ersten Start fragt eine Karte „Wie heißt du?"; der Name steht in den Bestwert-Tabellen und im Abschluss („Gartenmeister, Name!").

**Überprüfung 2026-10-09:** Alle Zahlen bleiben in 0–20 (auch Muster und Mauer-Spitze), Verben der Geschichten passen zum Gegenstand, Zahlenmauer Stufe 3 ohne Gleichung lösbar, „Mit der 10" Stufe 4 als zusammenhängender Rechenweg (14 + 5: erst 4 + 5, dann 10 + 9), Nachbarzahlen per Kugel, wechselnde Muster in Stufe 4. Neu: „Wie viele Punkte?" (Mengen im Zwanzigerfeld erfassen, ohne Zeitlimit) und „Aufgabenfamilie". Geprüft in `lab/tests/tasks.test.mjs`.

**Hilfe und Unbekannte (2026-10-09):** Die Hilfe ist immer ein Kreisbild, nie Text: erste Zahl hell, zweite dunkel, weggenommene Kreise durchgestrichen; bei Vergleichen je eine Kreisreihe pro Seite; beim Zahlenstrahl werden alle Zahlen sichtbar. Die Unbekannte ist ein eingefärbtes Fragezeichen statt eines leeren Kästchens. Plus und Minus über die 10 rechnen nur vorwärts: „16 − 7: erst 6 weg, dann 1 weg“ mit 16 − 6 = ? und 10 − 1 = ?; die Rückwärtsform „7 sind 6 und ?“ entfällt. Die Musik pausiert, sobald die App im Hintergrund ist.

**Aufgabenfamilie (neu gefasst 2026-10-09):** zwei Rechnungen mit denselben drei Zahlen, in anderer Kombination: Plus → Minus-Umkehr (8 + 6 = 14, dann 14 − 6 = 8), Tausch (8 + 6, dann 6 + 8) oder Minus → Plus. Beim zweiten Schritt steht die erste, gelöste Rechnung darüber („Dazu passt: …“). Nach der richtigen Antwort werden gleiche Zahlen gleich eingefärbt (kleine Zahl, mittlere Zahl, Summe) und bleiben 2,4 s stehen, bevor die Karte weiterfährt.
