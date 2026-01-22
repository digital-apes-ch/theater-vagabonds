const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BASE_URL = process.env.BASE_URL || 'https://theatervagabunden.ch';

// Lade Environment Variablen aus .env (falls vorhanden)
// (Deployment-Umgebungen setzen ENV meist direkt; lokal ist .env praktisch)
require('dotenv').config();

// Gzip Kompression für bessere Performance
app.use(compression());

// Security Headers
app.use((req, res, next) => {
  // XSS Protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (angepasst für externe Ressourcen)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "img-src 'self' data: https:; " +
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://va.vercel-scripts.com https://www.flickr.com; " +
    "frame-src 'self' https://www.flickr.com;"
  );
  
  next();
});

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function replacePlaceholders(html) {
  const replacements = {
    'TICKET_LINK_1': process.env.TICKET_LINK_1 || '#',
    'TICKET_LINK_2': process.env.TICKET_LINK_2 || '#',
    'TICKET_LINK_3': process.env.TICKET_LINK_3 || '#',
    'TICKET_LINK_4': process.env.TICKET_LINK_4 || '#',
    // BASE_URL Ersetzungen - Reihenfolge ist wichtig!
    '"BASE_URL_PLACEHOLDER"': `"${BASE_URL}"`, // Für JSON-LD in Anführungszeichen
    'BASE_URL_PLACEHOLDER/': `${BASE_URL}/`,
    'BASE_URL_PLACEHOLDER#': `${BASE_URL}#`,
    'BASE_URL_PLACEHOLDER': BASE_URL, // Muss zuletzt kommen
  };

  for (const [token, rawValue] of Object.entries(replacements)) {
    const safe = escapeHtmlAttr(rawValue);
    html = html.split(token).join(safe);
  }

  return html;
}

async function renderIndexHtml() {
  const indexPath = path.join(__dirname, 'index.html');
  let html = await fs.readFile(indexPath, 'utf8');
  return replacePlaceholders(html);
}

async function renderImpressumHtml() {
  const impressumPath = path.join(__dirname, 'impressum.html');
  let html = await fs.readFile(impressumPath, 'utf8');
  return replacePlaceholders(html);
}

async function renderSitemap() {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  let sitemap = await fs.readFile(sitemapPath, 'utf8');
  
  // Ersetze BASE_URL_PLACEHOLDER in sitemap.xml
  sitemap = sitemap.replace(/BASE_URL_PLACEHOLDER/g, BASE_URL);
  
  return sitemap;
}

async function renderRobots() {
  const robotsPath = path.join(__dirname, 'robots.txt');
  let robots = await fs.readFile(robotsPath, 'utf8');
  
  // Ersetze BASE_URL_PLACEHOLDER in robots.txt
  robots = robots.replace(/BASE_URL_PLACEHOLDER/g, BASE_URL);
  
  return robots;
}

// Serviere index.html mit ENV-Injection (muss VOR express.static kommen)
app.get('/', async (req, res) => {
  try {
    const html = await renderIndexHtml();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Fehler beim Rendern von index.html', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/index.html', async (req, res) => {
  try {
    const html = await renderIndexHtml();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Fehler beim Rendern von index.html', err);
    res.status(500).send('Internal Server Error');
  }
});

// Serviere impressum.html mit ENV-Injection
app.get('/impressum.html', async (req, res) => {
  try {
    const html = await renderImpressumHtml();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Fehler beim Rendern von impressum.html', err);
    res.status(500).send('Internal Server Error');
  }
});

// Serviere robots.txt mit korrektem Content-Type und dynamischer BASE_URL
app.get('/robots.txt', async (req, res) => {
  try {
    const robots = await renderRobots();
    res.type('text/plain');
    res.set('Cache-Control', 'public, max-age=86400'); // 24 Stunden Cache
    res.send(robots);
  } catch (err) {
    console.error('Fehler beim Rendern von robots.txt', err);
    res.status(500).send('Internal Server Error');
  }
});

// Serviere sitemap.xml mit korrektem Content-Type und dynamischer BASE_URL
app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await renderSitemap();
    res.type('application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 Stunde Cache
    res.send(sitemap);
  } catch (err) {
    console.error('Fehler beim Rendern von sitemap.xml', err);
    res.status(500).send('Internal Server Error');
  }
});

// Serviere statische Dateien aus dem Root-Verzeichnis (aber nicht index.html und impressum.html)
app.use(express.static(path.join(__dirname), {
  index: false,
  maxAge: NODE_ENV === 'production' ? '1y' : '0', // 1 Jahr Cache in Production
  setHeaders: (res, filePath) => {
    // Verhindere, dass index.html und impressum.html direkt als statische Dateien serviert werden
    const basename = path.basename(filePath);
    if (basename === 'index.html' || basename === 'impressum.html') {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    
    // Cache-Strategien für verschiedene Dateitypen
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
      res.setHeader('Cache-Control', NODE_ENV === 'production' ? 'public, max-age=31536000, immutable' : 'no-cache');
    } else if (['.css', '.js'].includes(ext)) {
      res.setHeader('Cache-Control', NODE_ENV === 'production' ? 'public, max-age=31536000, immutable' : 'no-cache');
    }
  }
}));

// Fallback für alle anderen Routen - serviere index.html (mit ENV-Injection)
app.get('*', async (req, res) => {
  // Überspringe statische Dateien
  if (req.path.includes('.')) {
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
      return res.status(404).send('Not Found');
    }
  }
  
  try {
    const html = await renderIndexHtml();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache');
    res.send(html);
  } catch (err) {
    console.error('Fehler beim Rendern von index.html', err);
    if (NODE_ENV === 'production') {
      res.status(500).send('Internal Server Error');
    } else {
      res.status(500).send(`Error: ${err.message}`);
    }
  }
});

// Error Handler für unhandled routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send(NODE_ENV === 'production' ? 'Internal Server Error' : err.message);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Base URL: ${BASE_URL}`);
  if (NODE_ENV === 'development') {
    console.log(`Öffne http://localhost:${PORT} im Browser`);
  }
});
