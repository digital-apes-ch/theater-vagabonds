# Deployment Checkliste

## Vor dem Deployment

### 1. Environment-Variablen prüfen

Stelle sicher, dass folgende Variablen in deiner Deployment-Umgebung gesetzt sind:

#### Erforderlich:
- ✅ `BASE_URL` - Die vollständige URL deiner Website (z.B. `https://theatervagabunden.ch`)
  - **Wichtig:** Ohne trailing slash am Ende!
  - Diese Variable wird für alle SEO-Meta-Tags, Open Graph, Twitter Cards und strukturierte Daten verwendet

#### Empfohlen:
- ✅ `NODE_ENV=production` - Für optimale Performance und Security
- ✅ `PORT` - Port auf dem der Server laufen soll (Standard: 3000)

#### Optional:
- ✅ `TICKET_LINK_1` bis `TICKET_LINK_4` - URLs für die Ticket-Links

### 2. Dependencies installieren

```bash
npm install --production
```

### 3. Server starten

```bash
NODE_ENV=production npm start
```

## Nach dem Deployment

### 1. Funktionalität testen

- [ ] Website lädt korrekt
- [ ] Alle Bilder werden angezeigt
- [ ] Ticket-Links funktionieren (falls gesetzt)
- [ ] Impressum-Seite lädt korrekt
- [ ] Mobile Ansicht funktioniert

### 2. SEO-Dateien prüfen

- [ ] `https://deine-domain.ch/robots.txt` - Sollte BASE_URL enthalten
- [ ] `https://deine-domain.ch/sitemap.xml` - Sollte BASE_URL enthalten
- [ ] Meta-Tags im HTML-Quellcode prüfen (Rechtsklick → Seitenquelltext anzeigen)
  - Canonical URL sollte korrekt sein
  - Open Graph Tags sollten BASE_URL enthalten
  - Twitter Cards sollten BASE_URL enthalten

### 3. Google Search Console

- [ ] Website in Google Search Console hinzufügen
- [ ] Sitemap einreichen: `https://deine-domain.ch/sitemap.xml`
- [ ] robots.txt prüfen lassen

### 4. Performance prüfen

- [ ] Gzip-Kompression aktiv (kann mit Browser DevTools geprüft werden)
- [ ] Security Headers vorhanden (kann mit [securityheaders.com](https://securityheaders.com) geprüft werden)

## Häufige Probleme

### Problem: URLs zeigen noch "theatervagabunden.ch" statt deiner Domain

**Lösung:** Stelle sicher, dass `BASE_URL` korrekt gesetzt ist und der Server neu gestartet wurde.

### Problem: Bilder werden nicht angezeigt

**Lösung:** Prüfe, ob der `source/` Ordner korrekt deployed wurde und die Pfade relativ sind.

### Problem: Server startet nicht

**Lösung:** 
- Prüfe, ob Node.js Version >= 18.0.0 installiert ist
- Prüfe, ob alle Dependencies installiert sind: `npm install`
- Prüfe die Logs auf Fehlermeldungen

## Support

Bei Problemen kontaktiere: Digital Apes GmbH
