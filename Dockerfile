# Verwende offizielles Node.js Image
FROM node:18-alpine

# Setze Arbeitsverzeichnis
WORKDIR /app

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY package*.json ./

# Installiere Dependencies
RUN npm install

# Kopiere alle statischen Dateien
COPY . .

# Exponiere Port 3000
EXPOSE 3000

# Starte den Server
CMD ["npm", "start"]
