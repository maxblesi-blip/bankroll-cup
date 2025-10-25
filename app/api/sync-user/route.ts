// app/api/sync-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const LEADERBOARD_SHEET = "Leaderboard";

async function getAuthClient() {
  try {
    const key = JSON.parse(process.env.GOOGLE_SHEETS_API_KEY || "{}");
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } catch (error) {
    console.error("❌ Auth Error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { discordId, discordUsername, discordEmail } = await request.json();

    console.log(`\n📊 [SYNC USER] Synce zu Leaderboard Sheet:`);
    console.log(`   Discord ID: ${discordId}`);
    console.log(`   Username: ${discordUsername}`);
    console.log(`   Email: ${discordEmail}`);

    // Validierung
    if (!discordId || !discordEmail) {
      console.warn("⚠️  Fehlende Discord ID oder Email");
      return NextResponse.json(
        { error: "Missing discordId or discordEmail" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Google Auth fehlgeschlagen");
      return NextResponse.json(
        { error: "Auth failed" },
        { status: 500 }
      );
    }

    const sheets = google.sheets("v4");

    // Hole alle Leaderboard Einträge
    // Struktur: A=ID, B=Email, C=Name, D=GGPoker, E=Discord, F=Bankroll, G=Livestream, H=Verification, I=LastUpdated
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${LEADERBOARD_SHEET}!A2:I1000`,
    });

    const rows = response.data.values || [];
    console.log(`📋 Gefunden ${rows.length} Einträge im Leaderboard`);

    // ✅ Suche nach User mit dieser EMAIL (Spalte B, Index 1)
    const existingRowIndex = rows.findIndex((row: string[]) => {
      const rowEmail = row[1]?.toString().toLowerCase().trim() || "";
      return rowEmail === discordEmail.toLowerCase().trim();
    });

    if (existingRowIndex !== -1) {
      console.log(`✅ User existiert bereits bei Reihe ${existingRowIndex + 2}`);
      // User existiert - nur aktualisieren wenn nötig
      const currentRow = rows[existingRowIndex];
      const updatedRow = [
        currentRow[0], // A: ID
        discordEmail, // B: Email (✅ ECHTE EMAIL!)
        currentRow[2] || discordUsername, // C: Name
        currentRow[3], // D: GGPoker
        discordId, // E: Discord (Update Discord ID)
        currentRow[5], // F: Bankroll
        currentRow[6], // G: Livestream
        currentRow[7], // H: Verification
        new Date().toISOString().split("T")[0], // I: Last Updated
      ];

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: SHEET_ID,
        range: `${LEADERBOARD_SHEET}!A${existingRowIndex + 2}:I${existingRowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedRow] },
      });

      console.log(`✅ User aktualisiert: ${discordUsername} (${discordEmail})`);
      return NextResponse.json(
        { success: true, message: "User updated" },
        { status: 200 }
      );
    }

    // ✅ User existiert NICHT - erstelle neuen Eintrag
    console.log(`📝 Erstelle neuen User im Leaderboard...`);

    const newId = Date.now().toString();
    
    // ✅ STRUKTUR: A=ID, B=Email, C=Name, D=GGPoker, E=Discord, F=Bankroll, G=Livestream, H=Verification, I=LastUpdated
    const newRow = [
      newId, // A: ID
      discordEmail, // B: Email (✅ ECHTE EMAIL!)
      discordUsername, // C: Name
      "", // D: GGPoker (leer - wird später gefüllt)
      discordId, // E: Discord ID
      "0", // F: Bankroll (0 - wird später gefüllt)
      "", // G: Livestream (leer)
      new Date().toISOString().split("T")[0], // H: Verification (Anmeldedatum)
      new Date().toISOString().split("T")[0], // I: Last Updated
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${LEADERBOARD_SHEET}!A2:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    console.log(`✅ Neuer User erstellt: ${discordUsername} (${discordEmail})\n`);

    return NextResponse.json(
      {
        success: true,
        message: "User created",
        id: newId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}