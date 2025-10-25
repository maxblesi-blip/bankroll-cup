# MP Bankroll Cup - API Dokumentation

## Übersicht

Die API bietet Endpoints zur Verwaltung von Spielern, Anmeldungen und Authentifizierung.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Authentication

### Discord OAuth2 Flow

**Endpoint:** `GET /auth/signin`

Startet den Discord OAuth2 Login-Flow.

**Response:**
- Redirect zu Discord Login
- Nach Login: Redirect zu Callback mit Code

---

## Endpoints

### 1. Registration (Anmeldung)

#### POST /registration

Registriert einen neuen Spieler.

**Request Body:**
```json
{
  "name": "Max Mustermann",
  "ggpokerNickname": "ProPlayer123",
  "livestreamLink": "https://twitch.tv/prostream",
  "message": "Ich möchte teilnehmen!",
  "userId": "user@discord.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Anmeldung erfolgreich eingereicht",
  "id": "abc123def456"
}
```

**Error (400):**
```json
{
  "error": "Name und GGPoker Nickname sind erforderlich"
}
```

---

#### GET /registration

Ruft alle Anmeldungen ab (nur Admin).

**Authentication:** Required (Admin Role)

**Response (200):**
```json
{
  "registrations": [
    {
      "id": "abc123",
      "name": "Max Mustermann",
      "ggpokerNickname": "ProPlayer123",
      "status": "pending",
      "submittedAt": "2025-10-23T10:00:00Z"
    }
  ]
}
```

---

### 2. Google Sheets Integration

#### GET /sheets/players

Ruft alle Spieler-Daten aus Google Sheets ab.

**Query Parameters:**
- `sort` (optional): "bankroll" | "name" (default: "bankroll")
- `order` (optional): "asc" | "desc" (default: "desc")

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Spieler A",
      "ggpokerNickname": "ProPlayer123",
      "bankroll": 3500,
      "livestreamLink": "https://twitch.tv/prostream",
      "lastVerification": "2025-10-22"
    },
    {
      "id": "2",
      "name": "Spieler B",
      "ggpokerNickname": "HighRoller99",
      "bankroll": 2800,
      "lastVerification": "2025-10-22"
    }
  ]
}
```

---

#### POST /sheets/players

Aktualisiert Spieler-Daten in Google Sheets (nur Mod/Admin).

**Authentication:** Required (Mod or Admin Role)

**Request Body:**
```json
{
  "id": "1",
  "bankroll": 3500,
  "lastVerification": "2025-10-23",
  "notes": "Screenshot überprüft"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Spielerdaten aktualisiert"
}
```

---

### 3. Authentication

#### GET /auth/session

Ruft die aktuelle Session ab.

**Response (200):**
```json
{
  "user": {
    "name": "Max Mustermann",
    "email": "max@discord.com",
    "image": "https://cdn.discordapp.com/...",
    "role": "player"
  },
  "expires": "2025-10-30T10:00:00Z"
}
```

**Response (401):**
```json
null
```

---

#### GET /auth/signin

Startet Discord OAuth2 Login.

**Query Parameters:**
- `callbackUrl` (optional): Redirect nach Login

---

#### GET /auth/signout

Beendet die aktuelle Session.

---

## Error Codes

| Code | Beschreibung |
|------|-------------|
| 200 | OK - Request erfolgreich |
| 201 | Created - Ressource erstellt |
| 400 | Bad Request - Ungültige Daten |
| 401 | Unauthorized - Nicht authentifiziert |
| 403 | Forbidden - Keine Berechtigung |
| 404 | Not Found - Ressource nicht gefunden |
| 500 | Server Error - Interner Fehler |

---

## Rollen & Berechtigungen

| Rolle | /registration | POST /sheets/players | /admin |
|-------|--------------|---------------------|--------|
| Admin | ✅ | ✅ | ✅ |
| Mod | ❌ | ✅ | ✅ |
| Player | ✅ | ❌ | ❌ |
| User | ❌ | ❌ | ❌ |

---

## Rate Limiting

API Requests sind limitiert auf:
- 100 Requests pro Minute pro IP
- 1000 Requests pro Stunde pro API Key

Response Header:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635012345
```

---

## Datentypen

### Player Object

```typescript
interface Player {
  id: string;
  name: string;
  ggpokerNickname: string;
  bankroll: number;
  livestreamLink?: string;
  lastVerification: string; // ISO 8601 date
  status: "pending" | "verified" | "inactive";
}
```

### User Object

```typescript
interface User {
  name: string;
  email: string;
  image: string;
  role: "admin" | "mod" | "player" | "user";
}
```

---

## Beispiele

### cURL

```bash
# Hole alle Spieler
curl -X GET http://localhost:3000/api/sheets/players

# Registriere neuen Spieler
curl -X POST http://localhost:3000/api/registration \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Max Mustermann",
    "ggpokerNickname": "ProPlayer123",
    "livestreamLink": "https://twitch.tv/prostream"
  }'

# Update Spieler-Bankroll (mit Auth)
curl -X POST http://localhost:3000/api/sheets/players \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "1",
    "bankroll": 3500,
    "lastVerification": "2025-10-23"
  }'
```

### JavaScript/Fetch

```javascript
// Hole Spieler
async function getPlayers() {
  const response = await fetch('/api/sheets/players');
  const data = await response.json();
  return data.data;
}

// Registriere Spieler
async function registerPlayer(playerData) {
  const response = await fetch('/api/registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(playerData),
  });
  return await response.json();
}

// Update Spieler
async function updatePlayer(playerData) {
  const response = await fetch('/api/sheets/players', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(playerData),
  });
  return await response.json();
}
```

---

## Webhook Integration (Zukünftig)

Geplante Webhooks für Discord:

- `player.registered` - Neue Anmeldung
- `player.verified` - Bankroll verifiziert
- `player.milestone` - Spieler erreicht Ziel

---

## Support

Bei API-Fragen: Erstelle ein GitHub Issue oder wende dich an den Admin.
