# Bildergalerie-Komponente

## Decisions
- Die Bildersektion ist eine eigenständige, wiederverwendbare Komponente in zwei Dateien: `scripts/gallery.js` und `styles/gallery.css` — nicht mehr Inline-Code in `index.html`.
- Konfiguration ausschliesslich über `data-`Attribute am Container `[data-gallery]` (`data-count`, `data-src`, `data-ext`, `data-alt` mit `{n}`-Platzhalter). Kein hartcodierter Pfad/Anzahl im JS.
- Zwei Darstellungen per Breakpoint, vom JS gesteuert (nicht rein CSS):
  - **Mosaik** (`>= 760px`): Raster (4×3 ab 1100px, sonst 3×3). Einzelne Kacheln drehen sich periodisch um die Y-Achse (Flip-Card) und tauschen dabei das Foto aus dem Pool aller Bilder.
  - **Peek/Coverflow** (`< 760px`): horizontales `scroll-snap`-Karussell, aktives Bild gross/hervorgehoben, Nachbarn schauen hervor.
- Lightbox wird vom Komponenten-Skript zur Laufzeit erzeugt (nicht im HTML), Navigation per Klick, Pfeiltasten und Esc.
- Bilder werden vor dem Commit auf max. 1600px / JPEG ~72% verkleinert (`sips`), benannt `TVT_<jahr>_<n>.jpg`, natürlich sortiert.

## Reasoning
- **Statische Seite, kein Framework** (Express liefert `index.html` + statische Assets). Eine „Komponente" ist hier eine gekapselte JS+CSS-Datei mit Daten-API über `data-`Attribute — bewusst framework-frei gehalten, passend zum bestehenden Stack.
- **JS-gesteuerte Modi statt reinem CSS**: Mosaik (paginierte/flippende Teilmenge) und Peek (alle Bilder im Scroll-Track) sind zu unterschiedliche Interaktionsmodelle, um sie sauber mit denselben DOM-Knoten per CSS umzuschalten. Re-Render nur bei echtem Layout-Wechsel (Signatur aus Modus+Spalten), um Resize-Sturm zu vermeiden.
- **Flip-Mosaik** entstand aus dem Wunsch nach einer modernen, lebendigen Foto-Wand ohne Dead Space — gewählt gegenüber statischem Raster mit Pfeil-Pagination (vorherige Iteration) und gegenüber einem Einzelbild-Karussell (zu viel Leerraum durch `object-fit: contain`).
- **Bildoptimierung**: Originale waren ~2.5–3MB × 67 ≈ 180MB. Ohne Verkleinerung wäre die Galerie unbrauchbar (alle Bilder im DOM). 1600px reicht für Retina im Anzeigebereich; Lightbox zeigt dasselbe optimierte Bild (`contain`, unbeschnitten).
- **Performance/Respekt**: Flips pausieren bei verstecktem Tab (`visibilitychange`) und bei `prefers-reduced-motion`.

## Implications
- Neue Foto-Sets: Bilder optimieren, als `TVT_<jahr>_<n>.jpg` ablegen, `data-count`/`data-src` am Container anpassen — kein Code-Eingriff nötig.
- Die Komponente ist auf anderen Seiten wiederverwendbar (ein `<div data-gallery ...>` + die zwei Dateien einbinden).
- `object-fit: cover` in Mosaik/Peek-Kacheln beschneidet leicht (einheitliche Kacheln); volles Bild nur in der Lightbox. Bewusster Trade-off gegen Dead Space.
- CSP erlaubt `script-src 'self'` / `style-src 'self'` — externe Komponentendateien funktionieren ohne CSP-Änderung.

## Open questions
- Bei deutlich mehr Bildern (>100) könnte der Peek-Modus (alle im DOM) optimiert werden (Virtualisierung/Lazy-Mounting). Aktuell unkritisch.
- Mosaik zeigt nur `cols × 3` Kacheln gleichzeitig; ob alle Bilder über Flips „garantiert" einmal erscheinen, ist nicht erzwungen (zufällige Kachelwahl). Für reine Deko akzeptiert.

## Last updated
2026-06-23
