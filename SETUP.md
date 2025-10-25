# MP Bankroll Cup - Setup & Deployment Guide

## 🔧 Schritt-für-Schritt Setup

### Phase 1: Lokale Entwicklung

#### 1.1 Discord Bot einrichten

1. **Developer Portal öffnen**
   - Gehe zu https://discord.com/developers/applications
   - Klicke auf "New Application"
   - Gib einen Namen ein (z.B. "MP Bankroll Cup Bot")

2. **General Information**
   - Kopiere die **Client ID**
   - Klicke auf "Reset Secret" und kopiere das **Client Secret**

3. **OAuth2 Konfigurieren**
   - Gehe zu OAuth2 → General
   - Trage unter "Redirects" ein:
     ```
     http://localhost:3000/api/auth/callback/discord
     ```
   - Speichern

4. **Scopes & Permissions**
   - Unter OAuth2 → URL Generator:
   - Wähle Scope: `identify` und `guilds`
   - Keine Permissions nötig für Login
   - Generiere die URL und nutze sie um den Bot auf deinen Server einzuladen

5. **Bot erstellen (optional, für Rolle-Abfrage)**
   - Gehe zu Bot section
   - Klicke "Add Bot"
   - Kopiere den Bot Token (DISCORD_TOKEN)
   - Aktiviere "Server Members Intent"

#### 1.2 Google Sheets vorbereiten

1. **Google Cloud Projekt erstellen**
   - Gehe zu https://console.cloud.google.com/
   - Erstelle ein neues Projekt
   - Suche nach "Google Sheets API" und aktiviere es

2. **API Schlüssel generieren**
   - Gehe zu Credentials
   - Erstelle einen neuen API Schlüssel
   - Kopiere den Schlüssel

3. **Google Sheet erstellen**
   - Öffne Google Sheets
   - Erstelle ein neues Sheet mit Namen "MP Bankroll Cup"
   - Erstelle Spalten: Name | GGPoker | Bankroll | Link | Verification
   - Kopiere die Spreadsheet ID (in der URL)

#### 1.3 Projekt Setup

```bash
# Klone das Repository oder kopiere die Dateien
cd bankroll-cup

# Installiere Dependencies
npm install

# Erstelle .env.local
cat > .env.local << EOF
# Discord
DISCORD_CLIENT_ID=YOUR_CLIENT_ID
DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET
DISCORD_SERVER_ID=YOUR_SERVER_ID
DISCORD_TOKEN=YOUR_BOT_TOKEN

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# Google Sheets
GOOGLE_SHEETS_API_KEY=YOUR_API_KEY
GOOGLE_SHEETS_SPREADSHEET_ID=YOUR_SPREADSHEET_ID

# Rollen (später konfigurieren)
ADMIN_ROLE_ID=
MOD_ROLE_ID=
PLAYER_ROLE_ID=
EOF

# Starte Entwicklungsserver
npm run dev
```

Öffne http://localhost:3000 im Browser.

#### 1.4 Discord Rollen einrichten

1. **Auf deinem Discord Server**
   - Gehe zu Server Settings → Rollen
   - Erstelle neue Rollen:
     - "Admin" (höchste Stufe)
     - "Mod" (mittlere Stufe)
     - "Player" (Basis)

2. **Role IDs kopieren**
   - Aktiviere Developer Mode (Discord Settings → Advanced)
   - Rechtsklick auf jede Rolle
   - Klicke "Copy Role ID"
   - Trage die IDs in .env.local ein:
   ```
   ADMIN_ROLE_ID=12345678901234567
   MOD_ROLE_ID=12345678901234568
   PLAYER_ROLE_ID=12345678901234569
   ```

3. **Rollen zuweisen**
   - Gebe dir selbst die Admin Rolle
   - Gebe anderen Mods die Mod Rolle
   - Gebe Spielern die Player Rolle

---

### Phase 2: Datenbank Setup (Optional)

Falls du eine Datenbank möchtest für erweiterte Features:

#### PostgreSQL

```bash
# Installiere PostgreSQL
# macOS:
brew install postgresql
brew services start postgresql

# Linux:
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Windows: Download von postgresql.org

# Erstelle eine Datenbank
createdb bankroll_cup

# Aktualisiere .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/bankroll_cup
```

#### MongoDB (Alternative)

```bash
# Nutze MongoDB Atlas (cloud)
# 1. Gehe zu https://www.mongodb.com/cloud/atlas
# 2. Erstelle ein kostenloses Cluster
# 3. Kopiere die Connection String
# 4. Trage ein in .env.local:
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/bankroll_cup
```

---

### Phase 3: Produktion (Vercel Deployment)

#### 3.1 Vorbereitung

```bash
# Erstelle ein GitHub Repo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/bankroll-cup.git
git push -u origin main
```

#### 3.2 Vercel Deployment

```bash
# Installiere Vercel CLI
npm install -g vercel

# Deployment
vercel
```

1. Wähle den Projekt-Namen
2. Wähle dein Framework (Next.js)
3. Bestätige die Einstellungen

#### 3.3 Environment Variables auf Vercel setzen

1. Gehe zu deinem Vercel Dashboard
2. Wähle das Projekt
3. Gehe zu Settings → Environment Variables
4. Füge alle Variablen aus .env.local hinzu:

```
DISCORD_CLIENT_ID = ...
DISCORD_CLIENT_SECRET = ...
NEXTAUTH_SECRET = ... (WICHTIG: Neuen generieren mit openssl rand -base64 32)
NEXTAUTH_URL = https://your-domain.vercel.app
GOOGLE_SHEETS_API_KEY = ...
GOOGLE_SHEETS_SPREADSHEET_ID = ...
ADMIN_ROLE_ID = ...
MOD_ROLE_ID = ...
PLAYER_ROLE_ID = ...
```

#### 3.4 Discord Redirect URLs aktualisieren

1. Gehe zu Discord Developer Portal
2. Gehe zur Application
3. OAuth2 → Redirects
4. Füge hinzu:
   ```
   https://your-domain.vercel.app/api/auth/callback/discord
   ```

---

### Phase 4: Tests

#### 4.1 Lokale Tests

```bash
# Homepage laden
http://localhost:3000

# Discord Login testen
Klicke "Discord Login" Button

# Admin Panel testen (als Admin User)
http://localhost:3000/admin

# Andere Seiten
- http://localhost:3000/rangliste
- http://localhost:3000/livestreams
- http://localhost:3000/anmeldung
```

#### 4.2 Fehlerbehandlung

**Discord Login funktioniert nicht:**
- Überprüfe Client ID & Secret
- Überprüfe Redirect URLs
- Überprüfe NEXTAUTH_URL

**Spieler-Daten zeigen nicht:**
- Überprüfe Google Sheets API Key
- Überprüfe Spreadsheet ID
- Überprüfe Spalten-Namen

**Rollen funktionieren nicht:**
- Überprüfe ob User die Discord Rolle hat
- Überprüfe Role IDs in .env
- Starte Server neu

---

### Phase 5: Produktion Optimization

#### 5.1 Sicherheit

```javascript
// NEXTAUTH_SECRET sollte IMMER stark sein:
openssl rand -base64 32

// DISCORD_CLIENT_SECRET sollte NIEMALS in Code sein
// Nutze nur Environment Variables
```

#### 5.2 Performance

```javascript
// next.config.js - Image Optimization
images: {
  domains: ['*.discordapp.com'],
  loader: 'vercel', // Auto optimiert auf Vercel
}
```

#### 5.3 Monitoring

```bash
# Vercel Analytics
# Automatisch auf Vercel aktiviert

# Logs überprüfen
vercel logs <project-name>
```

---

## 📋 Checkliste vor Launch

- [ ] Discord Client ID & Secret in .env
- [ ] NEXTAUTH_SECRET generiert
- [ ] Google Sheets API eingerichtet
- [ ] Discord Rollen erstellt & IDs in .env
- [ ] Redirect URLs in Discord konfiguriert
- [ ] Lokale Tests erfolgreich
- [ ] GitHub Repository erstellt
- [ ] Auf Vercel deployed
- [ ] Production URLs in Discord konfiguriert
- [ ] Erste Spieler hinzugefügt
- [ ] Admin/Mod Berechtigungen getestet
- [ ] Livestream Links getestet

---

## 🚀 Launch Tipps

1. **Test mit echtem Discord Server**
   - Laden deine Freunde ein
   - Gib ihnen Test-Rollen
   - Teste Anmeldung & Spielerverwaltung

2. **Erste Spieler-Daten**
   - Gib dir selbst eine Test-Bankroll
   - Überprüfe Rangliste & Diagramme
   - Teste Livestream-Integration

3. **Backup der Google Sheets**
   - Erstelle eine Kopie des Sheets
   - Sicherungen regelmäßig machen

4. **Community Info**
   - Poste den Launch-Link auf Discord
   - Erkläre die Funktionen
   - Lade Spieler zur Anmeldung ein

---

## 📞 Häufige Fragen

**Q: Kann ich die Bankroll-Ziele ändern?**
A: Ja! In den `.env.local` Dateien und in den Komponenten.

**Q: Wie viele Spieler kann die App unterstützen?**
A: Theoretisch unbegrenzt. Google Sheets hat ein Limit von 10 Millionen Zellen.

**Q: Kann ich mehrere Cups parallel laufen lassen?**
A: Ja, mit mehreren Google Sheets und unterschiedlichen URLs.

**Q: Wie sicher sind die Daten?**
A: NextAuth.js ist produktionsreif und sicher. Nutze HTTPS in Produktion!

---

Viel Erfolg mit dem MP Bankroll Cup! 🎰🏆
