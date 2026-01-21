# Theater Vagabunden Website

## Setup

1. Dependencies installieren:
```bash
npm install
```

2. Environment-Variablen setzen:
   - Erstelle eine `.env` Datei im Root-Verzeichnis
   - Oder setze die Variablen direkt in der Deployment-Umgebung

## Environment-Variablen

Die folgenden Variablen müssen gesetzt werden für die Ticket-Links:

```
TICKET_LINK_1="https://..."
TICKET_LINK_2="https://..."
TICKET_LINK_3="https://..."
TICKET_LINK_4="https://..."
```

**Wichtig:** Die `.env` Datei ist bereits in `.gitignore` und wird nicht ins Repository committed.

## Server starten

```bash
npm start
```

Der Server läuft standardmäßig auf Port 3000 (oder dem in `PORT` gesetzten Port).

## Deployment

Für Production:
1. Stelle sicher, dass alle Environment-Variablen in der Deployment-Umgebung gesetzt sind
2. Der Server verwendet `dotenv` für lokale Entwicklung, aber in Production sollten die Variablen direkt als Environment-Variablen gesetzt werden
3. Starte den Server mit `npm start` oder `node server.js`

## Features

- ✅ Environment-Variable-basierte Ticket-Links
- ✅ Digital Apes Footer mit Logo
- ✅ Responsive Design
