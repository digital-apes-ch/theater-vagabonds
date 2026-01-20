const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serviere statische Dateien aus dem Root-Verzeichnis
app.use(express.static(path.join(__dirname)));

// Fallback für alle Routen - serviere index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Öffne http://localhost:${PORT} im Browser`);
});
