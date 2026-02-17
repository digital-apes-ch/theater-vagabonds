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

## Docker Swarm Deployment

### 1. Image bauen

```bash
docker build \
  --build-arg BASE_URL=https://theatervagabunden.ch \
  --build-arg TICKET_LINK_1=https://example.com/ticket1 \
  --build-arg TICKET_LINK_2=https://example.com/ticket2 \
  --build-arg TICKET_LINK_3=https://example.com/ticket3 \
  --build-arg TICKET_LINK_4=https://example.com/ticket4 \
  -t theater-vagabunden:latest .
```

### 2. Image auf Registry pushen

```bash
# Tag für deine Registry
docker tag theater-vagabunden:latest registry.example.com/theater-vagabunden:latest

# Push zu Registry
docker push registry.example.com/theater-vagabunden:latest
```

### 3. Docker Stack Deploy

Erstelle eine `docker-compose.yml` für Swarm:

```yaml
version: '3.8'

services:
  web:
    image: registry.example.com/theater-vagabunden:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - BASE_URL=https://theatervagabunden.ch
      - TICKET_LINK_1=https://example.com/ticket1
      - TICKET_LINK_2=https://example.com/ticket2
      - TICKET_LINK_3=https://example.com/ticket3
      - TICKET_LINK_4=https://example.com/ticket4
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 5s
        failure_action: pause
        order: stop-first
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
    networks:
      - theater-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

networks:
  theater-network:
    driver: overlay
```

### 4. Stack deployen

```bash
docker stack deploy -c docker-compose.yml theater-vagabunden
```

### 5. Status prüfen

```bash
# Services anzeigen
docker stack services theater-vagabunden

# Logs anzeigen
docker service logs -f theater-vagabunden_web

# Health check prüfen
docker service ps theater-vagabunden_web
```

### 6. Update durchführen (Zero-Downtime)

```bash
# Neues Image bauen und pushen
docker build --build-arg BASE_URL=https://theatervagabunden.ch -t registry.example.com/theater-vagabunden:v1.1 .
docker push registry.example.com/theater-vagabunden:v1.1

# Service updaten
docker service update --image registry.example.com/theater-vagabunden:v1.1 theater-vagabunden_web
```

### 7. Rollback bei Problemen

```bash
docker service rollback theater-vagabunden_web
```

### Wichtige Features im Dockerfile

✅ **Multi-Stage Build** - Kleines finales Image (~50MB)  
✅ **Non-Root User** - Sicherheit durch `webapp` User  
✅ **Health Check** - Automatische Überwachung  
✅ **Graceful Shutdown** - SIGTERM für Rolling Updates  
✅ **Production Dependencies** - Nur notwendige Packages  
✅ **Metadata Labels** - Bessere Organisation im Swarm  

## Support

Bei Problemen kontaktiere: Digital Apes GmbH
