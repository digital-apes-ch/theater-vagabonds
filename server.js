const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;

// Lade Environment Variablen aus .env (falls vorhanden)
// (Deployment-Umgebungen setzen ENV meist direkt; lokal ist .env praktisch)
require('dotenv').config();

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function renderIndexHtml() {
  const indexPath = path.join(__dirname, 'index.html');
  let html = await fs.readFile(indexPath, 'utf8');

  const replacements = {
    'TICKET_LINK_1': process.env.TICKET_LINK_1 || '#',
    'TICKET_LINK_2': process.env.TICKET_LINK_2 || '#',
    'TICKET_LINK_3': process.env.TICKET_LINK_3 || '#',
    'TICKET_LINK_4': process.env.TICKET_LINK_4 || '#',
  };

  for (const [token, rawValue] of Object.entries(replacements)) {
    const safe = escapeHtmlAttr(rawValue);
    html = html.split(token).join(safe);
  }

  return html;
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

// Serviere statische Dateien aus dem Root-Verzeichnis (aber nicht index.html)
app.use(express.static(path.join(__dirname), {
  index: false,
  setHeaders: (res, filePath) => {
    // Verhindere, dass index.html direkt als statische Datei serviert wird
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-cache');
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
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Öffne http://localhost:${PORT} im Browser`);
});
