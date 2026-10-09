# Gates: Zaubergarten – Aufgaben, Oberfläche, Handschrift, Finale

OWNS: lab/**, docs/superpowers/specs/2026-10-08-zaubergarten-aufgaben.md, docs/DECISIONS.md

Scope: 32 gemischte Übungen für die vier Gärten, Handschrift-Erkennung, Vollbild-Übungsoberfläche, Tor-Sequenz mit Bestwerttafel, Feuerwerk-Finale, Glühwürmchen, Hexenhäuschen, Konzeptdokument.

- [x] G1: Aufgaben: 32 Marken, 4 Gärten gemischt, jede Rechenaufgabe mit Zahl ≥ 10, Antworten unabhängig nachgerechnet, Wertung und Bestwerte korrekt
  CHECK: node lab/tests/tasks.test.mjs
  EXPECT: TASKS OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\Gabriel Weiss\Documents\Claude_Vibecoding\lernapp_zahlen; path=5aafc0a57e72/43 entries; output=tasks=24000 steps=31068 eqChecked=25595 minMax=10 writeNodes=11 | TASKS OK

- [x] G2: Handschrift-Erkennung erreicht alle Schwellen im synthetischen Benchmark (mild/medium/stark, Falsch-Annahme klein)
  CHECK: node lab/tests/ink.test.mjs
  EXPECT: INK OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\Gabriel Weiss\Documents\Claude_Vibecoding\lernapp_zahlen; path=5aafc0a57e72/43 entries; output=pass  true-accept medium >= 85  (measured 87.9) | INK OK

- [x] G3: Szene ist verdrahtet (Skripte, Marken-Zeichen, Sequenz, Tafel, Feuerwerk, Finale, Glühwürmchen, Hexenhäuschen) und die Oberfläche enthält keine Timer/Leben/Ranglisten
  CHECK: node lab/tests/scene.check.mjs
  EXPECT: SCENE OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\Gabriel Weiss\Documents\Claude_Vibecoding\lernapp_zahlen; path=5aafc0a57e72/43 entries; output=SCENE OK

- [x] G4: Konzeptdokument enthält Themenplan, Aufgabenstufen, Oberfläche, Tor/Feuerwerk, Handschrift mit Messwerten und offene Punkte
  CHECK: node lab/tests/spec.check.mjs
  EXPECT: SPEC OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\Gabriel Weiss\Documents\Claude_Vibecoding\lernapp_zahlen; path=5aafc0a57e72/43 entries; output=SPEC OK

- [x] G5: Eine echte Übung im Browser (Tastatur/Antippen) läuft über 5 Fragen bis zur Ergebniskarte und schreibt den Bestwert (manuell im Browser geprüft)
  EVIDENCE: 2026-10-08, Browser-Vorschau, Knoten 3 (Zahlenstrahl): 5 Fragen per Antippen beantwortet, Ergebniskarte mit 100 Punkten; danach Bestwerte in localStorage 'zg_lab_state' gespeichert (best=[30,40,100,60,70,80,90,100] nach commitResult). Mobile-Layout 375x812 geprüft.

- [x] G6: Schreiben mit dem Finger im Browser: simulierte Striche für mehrere Ziffern werden erkannt und akzeptiert (manuell im Browser geprüft)
  EVIDENCE: 2026-10-08, Browser-Vorschau, Knoten 1 (Finger): simulierte Strich-Ereignisse fuer 3, 4, 9, 8, 7 wurden alle erkannt (read=3/4/9/8/7) und als richtig akzeptiert; keine JS-Fehler. Echte Fingerschrift nicht getestet.

- [x] G7: Garten 1 abgeschlossen: Marken leuchten nacheinander von unten nach oben, Tor öffnet sich, Gartentafel zeigt Bestwerte (manuell im Browser geprüft)
  EVIDENCE: 2026-10-08, Browser-Vorschau: Garten 1 per commitResult abgeschlossen; Screenshot zeigt alle 8 Marken mit Zeichen und Punkten, Tor offen mit Glitzer/Schmetterlingen, danach Gartentafel mit Bestwerten (Gesamt 570 von 800, 2 Sterne). Reihenfolge unten nach oben im Code (startSeq), im Standbild nicht einzeln beobachtet.

- [x] G8: Alle 4 Gärten abgeschlossen: Feuerwerk läuft, danach Tafel und Abschlusskarte, Hexenhäuschen leuchtet stärker (manuell im Browser geprüft)
  EVIDENCE: 2026-10-08, Browser-Vorschau: Fortschritt auf 31 Marken gesetzt, 32. mit 100 abgeschlossen; Screenshot zeigt Feuerwerk ueber der Szene und leuchtendes Hexenhaeschen; Abschlusskarte 'Gartenmeister!' per direktem Aufruf von ZGUI.showFinale gerendert (Screenshot: vier Gaerten, Gesamt 2261 von 3200). Die Zeitfolge Feuerwerk -> Tafel -> Karte nicht beobachtet: die Browser-Vorschau pausiert die Animation, wenn das Fenster verdeckt ist (document.hidden); der Code-Pfad (onEnd) ist nur gelesen.

- [x] G9: Nach einer erledigten Übung wachsen zuerst die Blumen, danach fahren Pfeil, Licht und Kamera zum nächsten Punkt (nicht gleichzeitig); Zahlenstrahl zeigt höchstens 2 Zahlen und nie die gefragte (Letzteres prüft G1)
  EVIDENCE: 2026-10-08, Browser-Vorschau: commitResult(1) -> Screenshots direkt danach und nach 1 s zeigen den Pfeil noch an Marke 2 mit wachsenden Blumen; nach ca. 4,5 s steht shownNext=2 und Pfeil/Kamera sind beim nächsten Punkt. Zahlenstrahl-Aufgabe 'Wo liegt die 17?' zeigt nur 10 und 20.

- [x] G10: Die zwei Punktfarben der Hilfe sind für alle 8 Gartenfarben und bei Farbsehschwächen gut unterscheidbar (dE >= 30, Leuchtdichte >= 3:1); die alte Kombination fällt durch dieselbe Messung
  CHECK: node lab/tests/colors.check.mjs
  EXPECT: COLORS OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\Gabriel Weiss\Documents\Claude_Vibecoding\lernapp_zahlen; path=5aafc0a57e72/43 entries; output=min colour difference (dE76, all hues, normal+deutan+protan+tritan) = 38.0 at 324deg/protan; min luminance contrast = 3.79:1 | COLORS OK

- [x] G11: Designsystem eingehalten: Tokens statt rohe Werte, 4-px-Raster, keine Emojis/Inline-Stile, ein Hauptknopf je Ansicht, Kontrast >= 4,5:1 für alle 8 Gartenfarben
  CHECK: node lab/tests/design.check.mjs
  EXPECT: DESIGN OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\Gabriel Weiss\Documents\Claude_Vibecoding\lernapp_zahlen; path=5aafc0a57e72/43 entries; output=declarations checked=447 icons=28 used=22; worst contrast: ink/white 14.3 | ink/tint-1 12.9 | ink/tint-2 11.3 | ink/fill 4.7 | ink/fill-down 7.3 | ink-2/white 6.8 | ink-2/tint-1 6.1 | ink-2/tint-2 5.3 | accent-ink/white 6.3 | accent-ink/tin

- [x] G12: Zahlenstrahl wird durch Ziehen einer Kugel beantwortet (richtig: rastet auf der Linie ein und wird akzeptiert; falsch: Hinweis, Kugel rollt zurück); Übungsbildschirm im neuen Design mit Linien-Symbolen
  EVIDENCE: 2026-10-08, Browser-Vorschau (375x812): simulierte Pointer-Ereignisse; Ziehen auf die gefragte Zahl -> Kugel translate(95px,58px) auf der Linie, Meldung 'Super geübt!'; Ziehen auf eine falsche Zahl -> Meldung 'Fast! Schau noch einmal genau hin.', Kugel danach zurück (transform leer). Screens Tastatur, Schreiben, Zahlenstrahl angesehen. Echtes Ziehen mit dem Finger nicht getestet.
