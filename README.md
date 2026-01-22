# Theater Vagabunden Website

## Setup

1. Dependencies installieren:
```bash
npm install
```

2. Environment-Variablen setzen:
   - Kopiere `.env.example` zu `.env` und passe die Werte an
   - Oder setze die Variablen direkt in der Deployment-Umgebung

## Environment-Variablen

Die folgenden Variablen müssen gesetzt werden:

### Erforderlich:
- `BASE_URL` - Die vollständige URL der Website (z.B. `https://theatervagabunden.ch`)
  - Wird für alle SEO-Meta-Tags, Open Graph, Twitter Cards und strukturierte Daten verwendet
  - **Wichtig:** Ohne trailing slash!

### Optional:
- `PORT` - Port auf dem der Server laufen soll (Standard: 3000)
- `NODE_ENV` - Environment-Modus (`development` oder `production`, Standard: `development`)
- `TICKET_LINK_1` bis `TICKET_LINK_4` - URLs für die Ticket-Links in den Aufführungen

**Wichtig:** Die `.env` Datei ist bereits in `.gitignore` und wird nicht ins Repository committed.

Siehe `.env.example` für ein vollständiges Beispiel.

## Server starten

### Development:
```bash
npm run dev
# oder
npm start
```

### Production:
```bash
npm run production
# oder
NODE_ENV=production npm start
```

Der Server läuft standardmäßig auf Port 3000 (oder dem in `PORT` gesetzten Port).

## Deployment

### Für Production:

1. **Environment-Variablen setzen:**
   - `BASE_URL` - **MUSS** gesetzt werden (z.B. `https://theatervagabunden.ch`)
   - `NODE_ENV=production`
   - `PORT` (optional, Standard: 3000)
   - `TICKET_LINK_1` bis `TICKET_LINK_4` (optional)

2. **Dependencies installieren:**
   ```bash
   npm install --production
   ```

3. **Server starten:**
   ```bash
   npm run production
   # oder
   NODE_ENV=production npm start
   ```

### Docker Deployment:

Das Projekt enthält ein `Dockerfile` für Container-Deployment:

```bash
docker build -t theater-vagabunden .
docker run -p 3000:3000 \
  -e BASE_URL=https://theatervagabunden.ch \
  -e NODE_ENV=production \
  -e TICKET_LINK_1=https://... \
  theater-vagabunden
```

## Production Features

- ✅ **SEO-optimiert**: Meta-Tags, Open Graph, Twitter Cards, strukturierte Daten (JSON-LD)
- ✅ **Security Headers**: XSS Protection, Content Security Policy, Frame Options
- ✅ **Performance**: Gzip-Kompression, optimiertes Caching für statische Assets
- ✅ **Dynamische URLs**: BASE_URL wird automatisch in allen SEO-Dateien verwendet
- ✅ **Environment-Variable-basierte Ticket-Links**
- ✅ **Responsive Design**
- ✅ **robots.txt & sitemap.xml** mit dynamischer BASE_URL

## Technische Details

- **Node.js**: >= 18.0.0 erforderlich
- **Framework**: Express.js
- **Compression**: Gzip für alle Responses
- **Caching**: 
  - Statische Assets: 1 Jahr in Production
  - HTML: No-Cache (wegen dynamischer Inhalte)
  - robots.txt: 24 Stunden
  - sitemap.xml: 1 Stunde
