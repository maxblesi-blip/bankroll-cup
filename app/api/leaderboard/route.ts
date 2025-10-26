// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

async function getAuthClient() {
  try {
    const key = JSON.parse(process.env.GOOGLE_SHEETS_API_KEY || "{}");
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } catch (error) {
    console.error("❌ Auth error:", error);
    return null;
  }
}

async function getSheetId(auth: any, sheetName: string): Promise<number | null> {
  try {
    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    const sheet = response.data.sheets?.find(
      (s: any) => s.properties?.title === sheetName
    );
    return sheet?.properties?.sheetId ?? null;
  } catch (error) {
    console.error(`❌ Error getting sheet ID for "${sheetName}":`, error);
    return null;
  }
}

const SHEET_NAME = "Leaderboard";
const HISTORY_SHEET_NAME = "LeaderboardHistory";
const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1i5nEi_FP0a6zv4jOD6oGIlSudc8doo4LqlxJAL7DV58";

interface Player {
  id: string;
  name: string;
  email: string;
  ggpokerNickname: string;
  bankroll: number;
  position: number;
  rank?: number;
  createdAt: string;
  lastUpdate: string;
  discordUsername?: string;
  discordId?: string;
  livestreamLink?: string;
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

// Prüfe ob Sheet existiert
async function sheetExists(auth: any, sheetName: string): Promise<boolean> {
  try {
    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId: SHEET_ID,
    });

    const sheet = response.data.sheets?.find(
      (s: any) => s.properties?.title === sheetName
    );
    return !!sheet;
  } catch (error) {
    console.error(`❌ Error checking if sheet exists:`, error);
    return false;
  }
}

async function getHistoricalData(auth: any): Promise<ChartData[]> {
  try {
    console.log(`📊 Versuche historische Daten zu laden...`);

    // Prüfe zuerst ob Sheet existiert
    const exists = await sheetExists(auth, HISTORY_SHEET_NAME);
    if (!exists) {
      console.log(`⚠️  Sheet "${HISTORY_SHEET_NAME}" existiert nicht - überspringe historische Daten`);
      return [];
    }

    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${HISTORY_SHEET_NAME}!A1:Z1000`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.log(`ℹ️  Keine historischen Daten vorhanden`);
      return [];
    }

    console.log(`✅ ${rows.length} historische Einträge gefunden`);

    // Header-Zeile: [date, Spieler A, Spieler B, ...]
    const headers = rows[0];
    const chartData: ChartData[] = rows.slice(1).map((row: string[]) => {
      const data: ChartData = { date: row[0] || "" };
      for (let i = 1; i < headers.length; i++) {
        const playerName = headers[i];
        const value = parseFloat(row[i]) || 0;
        data[playerName] = value;
      }
      return data;
    });

    return chartData;
  } catch (error) {
    console.error(`⚠️  Error getting historical data (nicht kritisch):`, error);
    return []; // Nicht kritisch - fahre trotzdem fort
  }
}

async function updateHistoricalData(auth: any, sheets: any) {
  try {
    console.log(`📊 Versuche historische Daten zu speichern...`);

    // Prüfe zuerst ob Sheet existiert
    const exists = await sheetExists(auth, HISTORY_SHEET_NAME);
    if (!exists) {
      console.log(`ℹ️  Sheet "${HISTORY_SHEET_NAME}" existiert nicht - überspringe`);
      return; // Nicht kritisch
    }

    // Hole aktuelle Rangliste
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:E1000`,
    });

    const rows = response.data.values || [];
    const today = new Date().toISOString().split("T")[0];

    // Erstelle Zeile für heute
    const historyRow = [today];
    rows.forEach((row: string[]) => {
      historyRow.push(String(parseFloat(row[4]) || 0)); // E: Bankroll (Index 4)
    });

    // Füge zu History hinzu
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${HISTORY_SHEET_NAME}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [historyRow] },
    });

    console.log(`✅ Historische Daten gespeichert`);
  } catch (error) {
    console.error(`⚠️  Error updating historical data (nicht kritisch):`, error);
    // Nicht kritisch - fahre trotzdem fort
  }
}

export async function GET() {
  try {
    console.log(`\n📖 GET Leaderboard mit korrekten Spalten...`);

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // ✅ KORREKTE Spalten: A-L (A2:L1000)
    // A=ID, B=Name, C=Email, D=GGPoker, E=Bankroll, F=Position, 
    // G=CreatedAt, H=LastUpdate, I=Discord Username, J=Discord ID, K=Livestream, L=Notes
    const leaderboardResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:L1000`,
    });

    const leaderboardRows = leaderboardResponse.data.values || [];
    console.log(`📊 ${leaderboardRows.length} Spieler im Leaderboard`);

    // ✅ Verarbeite Spielerdaten mit korrektem Spalten-Mapping
    let players: Player[] = leaderboardRows
      .filter((row: string[]) => row[0]) // Skip wenn keine ID
      .map((row: string[]) => ({
        id: row[0] || "", // A: ID
        name: row[1] || "", // B: Name
        email: row[2] || "", // C: Email
        ggpokerNickname: row[3] || "", // D: GGPoker
        bankroll: parseFloat(row[4]) || 0, // E: Bankroll ✅ KORREKT!
        position: parseInt(row[5]) || 0, // F: Position
        createdAt: row[6] || new Date().toISOString().split("T")[0], // G: CreatedAt
        lastUpdate: row[7] || new Date().toISOString().split("T")[0], // H: LastUpdate
        discordUsername: row[8] || "", // I: Discord Username ✅ NEU!
        discordId: row[9] || "", // J: Discord ID ✅ NEU!
        livestreamLink: row[10] || "", // K: Livestream Link
      }));

    // ✅ Sortiere nach Bankroll (absteigend) und setze Rank
    players = players
      .sort((a, b) => b.bankroll - a.bankroll)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));

    console.log(`✅ ${players.length} Spieler sortiert und verarbeitet`);
    console.log(`📤 First Player:`, players[0]);

    // Hole historische Daten für Chart (optional)
    const chartData = await getHistoricalData(auth);

    return NextResponse.json({
      players,
      chartData,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ GET Error:", error);
    return NextResponse.json(
      { error: "Error fetching leaderboard", players: [], chartData: [] },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, email, name, ggpokerNickname, bankroll, livestreamLink, discordId, discordUsername } =
      await request.json();

    console.log(`\n🔄 PUT Leaderboard: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Bankroll: ${bankroll}`);
    console.log(`   Discord ID: ${discordId}`);

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Hole alle Reihen um die zu aktualisieren zu finden
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:L1000`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Gefunden ${rows.length} Reihen im Leaderboard`);

    // ✅ PRIMÄR: Suche nach Discord ID (Spalte J, Index 9)
let rowIndex = -1;

if (discordId) {
  rowIndex = rows.findIndex((row: string[]) => {
    const rowDiscordId = row[9]?.toString().trim();
    return rowDiscordId === discordId;
  });
  console.log(`   Suche nach Discord ID: ${rowIndex !== -1 ? `Gefunden (Reihe ${rowIndex})` : "Nicht gefunden"}`);
}

// Fallback: Suche nach Email (für ältere Einträge)
if (rowIndex === -1 && email) {
  rowIndex = rows.findIndex((row: string[]) => {
    const rowEmail = row[2]?.toString().toLowerCase().trim();
    const searchEmail = email.toLowerCase().trim();
    return rowEmail === searchEmail;
  });
  console.log(`   Fallback Email: ${rowIndex !== -1 ? `Gefunden (Reihe ${rowIndex})` : "Nicht gefunden"}`);
}

// Final Fallback: Suche nach ID
if (rowIndex === -1 && id) {
  rowIndex = rows.findIndex((row: string[]) => row[0] === id);
  console.log(`   Fallback ID: ${rowIndex !== -1 ? `Gefunden (Reihe ${rowIndex})` : "Nicht gefunden"}`);
}

    const lastUpdate = new Date().toISOString().split("T")[0];

    if (rowIndex === -1) {
      // ✅ Spieler existiert nicht - erstelle NEUEN Eintrag
      console.log(`\n✨ Neuer Spieler - INSERT`);

      const newId = id || Date.now().toString();
      const values = [
        [
          newId, // A: ID
          name || "", // B: Name
          email || "", // C: Email
          ggpokerNickname || "", // D: GGPoker
          bankroll?.toString() || "0", // E: Bankroll
          "0", // F: Position
          lastUpdate, // G: CreatedAt
          lastUpdate, // H: LastUpdate
          discordUsername || "", // I: Discord Username ✅
          discordId || "", // J: Discord ID ✅
          livestreamLink || "", // K: Livestream Link
          "", // L: Notes
        ],
      ];

      console.log(`   📝 Neue Reihe: ${JSON.stringify(values[0])}`);

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A2:L`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });

      console.log(`✅ Neuer Spieler hinzugefügt: ${name}\n`);
    } else {
      // ✅ Spieler existiert - UPDATE bestehenden Eintrag
      console.log(`\n♻️  UPDATE bestehende Reihe ${rowIndex + 2}`);

      const currentRow = rows[rowIndex];

      const updatedRow = [
        currentRow[0] || id || Date.now().toString(), // A: ID (behalten)
        name || currentRow[1] || "", // B: Name
        email || currentRow[2] || "", // C: Email (behalten meist)
        ggpokerNickname || currentRow[3] || "", // D: GGPoker
        bankroll !== undefined ? bankroll.toString() : (currentRow[4] || "0"), // E: Bankroll ✅
        currentRow[5] || "0", // F: Position (behalten)
        currentRow[6] || lastUpdate, // G: CreatedAt (behalten)
        lastUpdate, // H: LastUpdate (neu setzen)
        discordUsername || currentRow[8] || "", // I: Discord Username ✅
        discordId || currentRow[9] || "", // J: Discord ID ✅
        livestreamLink || currentRow[10] || "", // K: Livestream Link
        currentRow[11] || "", // L: Notes (behalten)
      ];

      console.log(`   ✅ Update: Bankroll ${currentRow[4] || "0"} → ${updatedRow[4]}`);
      console.log(`   ✅ Update: Discord ID ${currentRow[9] || "-"} → ${updatedRow[9]}`);

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A${rowIndex + 2}:L${rowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedRow] },
      });

      console.log(`✅ Spieler aktualisiert: ${name} → €${updatedRow[4]}\n`);
    }

    // Versuche historische Daten zu speichern
    await updateHistoricalData(auth, sheets);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ PUT Error:", error);
    return NextResponse.json(
      { error: "Error updating leaderboard", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, discordId } = body; 
 
    console.log(`\n🗑️ DELETE: Lösche Spieler`);
    console.log(`   Email: ${email}`);

    if (!id && !email) {
      console.error(`❌ Keine ID oder Email im Request Body`);
      return NextResponse.json({ error: "ID or Email required" }, { status: 400 });
    }

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:L1000`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Gefunden ${rows.length} Reihen im Leaderboard`);

    // ✅ PRIMÄR: Suche nach Discord ID (Spalte J, Index 9)
let rowIndex = -1;

if (discordId) {
  rowIndex = rows.findIndex((row: string[]) => {
    const rowDiscordId = row[9]?.toString().trim();
    return rowDiscordId === discordId;
  });
  console.log(`   Suche nach Discord ID: ${rowIndex !== -1 ? "Ja" : "Nein"}`);
}

// Fallback: Suche nach Email
if (rowIndex === -1 && email) {
  rowIndex = rows.findIndex((row: string[]) => {
    const rowEmail = row[2]?.toString().toLowerCase().trim();
    const searchEmail = email.toLowerCase().trim();
    return rowEmail === searchEmail;
  });
  console.log(`   Fallback Email: ${rowIndex !== -1 ? "Ja" : "Nein"}`);
}

// Final Fallback: Suche nach ID
if (rowIndex === -1 && id) {
  rowIndex = rows.findIndex((row: string[]) => row[0] === id);
  console.log(`   Fallback ID: ${rowIndex !== -1 ? "Ja" : "Nein"}`);
}

    console.log(`   ✅ Gefunden bei Reihe ${rowIndex + 2}`);

    // Finde SheetId
    const sheetId = await getSheetId(auth, SHEET_NAME);
    if (sheetId === null) {
      console.error(`❌ Konnte SheetId für "${SHEET_NAME}" nicht finden`);
      return NextResponse.json(
        { error: "Could not find sheet" },
        { status: 500 }
      );
    }

    // Lösche Reihe
    await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Spieler gelöscht!\n`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}