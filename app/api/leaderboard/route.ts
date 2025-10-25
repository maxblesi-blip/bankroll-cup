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
const BANKROLL_SHEET_NAME = "Bankroll-Updates";

interface Player {
  rank: number;
  email: string; // ✅ HINZUGEFÜGT!
  name: string;
  ggpokerNickname: string;
  bankroll: number;
  startBankroll: number;
  percentToGoal: number;
  lastVerification: string;
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
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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

export async function GET() {
  try {
    console.log(`\n📖 GET Leaderboard mit aktuellen Bankroll-Updates (Email-Verknüpfung)...`);

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Hole Leaderboard Daten
    // Struktur: A=ID, B=Email(UserID), C=Name, D=GGPoker, E=Discord, F=Bankroll, G=Livestream, H=Verification, I=LastUpdated
    const leaderboardResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:I1000`,
    });

    const leaderboardRows = leaderboardResponse.data.values || [];
    console.log(`📊 ${leaderboardRows.length} Spieler im Leaderboard`);

    // Verarbeite Spielerdaten mit DYNAMISCHEN Bankroll-Updates (basierend auf Email)
    let players: Player[] = [];
    
    for (const row of leaderboardRows) {
      if (!row[0]) continue; // Skip wenn keine ID

      const playerId = row[0];
      const userEmail = row[1]; // UserID = Email (Spalte B, Index 1)
      console.log(`\n🔍 Lade Bankroll für "${row[2]}" (Email: ${userEmail})...`);

// ✅ NEU: Hole Bankroll direkt aus Leaderboard (Spalte F, Index 5)
const bankroll = parseFloat(row[5]) || 0;

      const player: Player = {
        rank: 0, // Wird später neu berechnet
        email: userEmail, // ✅ HINZUGEFÜGT!
        name: row[2] || "", // Spalte C (Name)
        ggpokerNickname: row[3] || "", // Spalte D (GGPoker)
        bankroll: bankroll,
        startBankroll: parseFloat(row[5]) || 500,
        livestreamLink: row[6] || undefined, // Spalte G (Livestream)
        lastVerification: row[7] || new Date().toISOString().split("T")[0], // Spalte H (Verification)
        percentToGoal: 0, // Wird später berechnet
      };

      players.push(player);
    }

    // Sortiere nach Bankroll (absteigend)
    players = players
      .sort((a, b) => b.bankroll - a.bankroll)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
        percentToGoal: Math.round((player.bankroll / 5000) * 100),
      }));

    console.log(`✅ ${players.length} Spieler sortiert und verarbeitet`);

    // Hole historische Daten für Chart (optional)
    const chartData = await getHistoricalData(auth);

    console.log(`✅ Leaderboard erfolgreich geladen\n`);

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
    const { id, email, name, ggpokerNickname, bankroll, livestreamLink } =
      await request.json();

    console.log(`\n🔄 PUT Leaderboard: ${name}`);
    console.log(`   ID: ${id}`);
    console.log(`   Email: ${email}`);

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Hole alle Reihen um die zu aktualisieren zu finden
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:I1000`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Gefunden ${rows.length} Reihen im Leaderboard`);

    // ✅ Suche nach Email (Spalte B, Index 1)
    let rowIndex = -1;
    
    if (email) {
      rowIndex = rows.findIndex((row: string[]) => {
        const rowEmail = row[1]?.toString().toLowerCase().trim();
        const searchEmail = email.toLowerCase().trim();
        console.log(`   Vergleiche: "${rowEmail}" === "${searchEmail}"`);
        return rowEmail === searchEmail;
      });
      console.log(`   ✅ Gefunden nach Email bei Index: ${rowIndex}`);
    }

    // Fallback: Suche nach ID
    if (rowIndex === -1 && id) {
      rowIndex = rows.findIndex((row: string[]) => row[0] === id);
      console.log(`   Fallback: Gefunden nach ID bei Index: ${rowIndex}`);
    }

    const lastVerification = new Date().toISOString().split("T")[0];

    if (rowIndex === -1) {
      // ✅ Spieler existiert nicht - erstelle NEUEN Eintrag
      console.log(`\n✨ Neuer Spieler - INSERT`);

      const newId = id || Date.now().toString();
      const values = [
        [
          newId, // A: ID
          email || "", // B: Email
          name, // C: Name
          ggpokerNickname, // D: GGPoker
          "", // E: Discord
          bankroll?.toString() || "0", // F: Bankroll
          livestreamLink || "", // G: Livestream
          lastVerification, // H: Verification
          lastVerification, // I: Last Updated
        ],
      ];

      console.log(`   📝 Neue Reihe: [${values[0].join(" | ")}]`);

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${SHEET_NAME}!A2:I`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });

      console.log(`✅ Neuer Spieler hinzugefügt: ${name}\n`);
    } else {
      // ✅ Spieler existiert - UPDATE bestehenden Eintrag
      console.log(`\n♻️  UPDATE bestehende Reihe ${rowIndex + 2}`);

      const currentRow = rows[rowIndex];
      console.log(`   Alte Daten: [${currentRow.join(" | ")}]`);

      const updatedRow = [
        currentRow[0] || id || Date.now().toString(), // A: ID (behalten oder setzen)
        email || currentRow[1] || "", // B: Email
        name || currentRow[2], // C: Name
        ggpokerNickname || currentRow[3] || "", // D: GGPoker
        currentRow[4] || "", // E: Discord (behalten)
        bankroll?.toString() || currentRow[5] || "0", // F: Bankroll
        livestreamLink || currentRow[6] || "", // G: Livestream
        currentRow[7] || lastVerification, // H: Verification (behalten)
        lastVerification, // I: Last Updated
      ];

      console.log(`   Neue Daten: [${updatedRow.join(" | ")}]`);

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${SHEET_NAME}!A${rowIndex + 2}:I${rowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedRow] },
      });

      console.log(`✅ Spieler aktualisiert: ${name} → €${bankroll}\n`);
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
    const { id, email } = body;

    console.log(`\n🗑️ DELETE: Lösche Spieler`);
    console.log(`   ID: ${id}`);
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
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:I1000`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Gefunden ${rows.length} Reihen im Leaderboard`);

    // ✅ Suche nach Email (Spalte B, Index 1)
    let rowIndex = -1;

    if (email) {
      rowIndex = rows.findIndex((row: string[]) => {
        const rowEmail = row[1]?.toString().toLowerCase().trim();
        const searchEmail = email.toLowerCase().trim();
        return rowEmail === searchEmail;
      });
      console.log(`   Gefunden nach Email: ${rowIndex !== -1 ? "Ja" : "Nein"}`);
    }

    // Fallback: Suche nach ID
    if (rowIndex === -1 && id) {
      rowIndex = rows.findIndex((row: string[]) => row[0] === id);
      console.log(`   Fallback: Gefunden nach ID: ${rowIndex !== -1 ? "Ja" : "Nein"}`);
    }

    if (rowIndex === -1) {
      console.error(`❌ Spieler nicht gefunden (Email: ${email}, ID: ${id})`);
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
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
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:F1000`,
    });

    const rows = response.data.values || [];
    const today = new Date().toISOString().split("T")[0];

    // Erstelle Zeile für heute
    const historyRow = [today];
    rows.forEach((row: string[]) => {
      historyRow.push(parseFloat(row[5]) || 0); // Bankroll ist in Spalte F (Index 5)
    });

    // Füge zu History hinzu
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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