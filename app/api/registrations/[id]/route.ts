// app/api/registrations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1i5nEi_FP0a6zv4jOD6oGIlSudc8doo4LqlxJAL7DV58";
const INITIAL_BANKROLL = parseFloat(process.env.BANKROLL_START || "500");

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

async function getSheetId(auth: any, sheetName: string): Promise<number | null> {
  try {
    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId: SHEET_ID,
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

// Aktualisiere Spieler im LEADERBOARD Sheet - EINZIGE QUELLE!
async function updateLeaderboard(
  sheets: any,
  auth: any,
  registrationRow: string[]
): Promise<boolean> {
  try {
    const playerId = registrationRow[0]; // ID
    const playerName = registrationRow[1]; // Name
    const playerEmail = registrationRow[2]; // Email
    const ggpokerNickname = registrationRow[3]; // GGPoker
    const discord = registrationRow[4]; // Discord
    const livestreamLink = registrationRow[5]; // Livestream

    console.log(`\n🔍 Leaderboard Update für "${playerName}"`);
    console.log(`   Email: ${playerEmail}`);
    console.log(`   Discord: ${discord}`);

    // Hole Leaderboard Daten
    // Struktur: A=ID, B=Email, C=Name, D=GGPoker, E=Discord, F=Bankroll, G=Livestream, H=Verification, I=LastUpdated
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Leaderboard!A2:I1000",
    });

    const rows = response.data.values || [];

    // Suche nach ID (Spalte A, Index 0)
    const rowIndex = rows.findIndex((row: string[]) => {
      const id = row[0]?.toString().trim();
      return id === playerId.toString().trim();
    });

    if (rowIndex === -1) {
      // INSERT: Neuer Spieler
      console.log(`✨ Neuer Spieler im Leaderboard - INSERT`);

      const newRow = [
        playerId, // A: ID
        playerEmail, // B: Email/UserID
        playerName, // C: Name
        ggpokerNickname, // D: GGPoker Nickname
        discord, // E: Discord
        INITIAL_BANKROLL.toString(), // F: Bankroll (initial)
        livestreamLink || "", // G: Livestream Link
        new Date().toISOString().split("T")[0], // H: Verification
        new Date().toISOString().split("T")[0], // I: Last Updated
      ];

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: SHEET_ID,
        range: "Leaderboard!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newRow] },
      });

      console.log(`✅ Neuer Spieler im Leaderboard: ${playerName} (${playerEmail})`);
      return true;
    } else {
      // UPDATE: Spieler existiert bereits
      console.log(`♻️  Spieler existiert im Leaderboard - UPDATE (Index ${rowIndex})`);

      const currentRow = rows[rowIndex];

      const updatedRow = [
        currentRow[0], // A: ID (behalten)
        playerEmail, // B: Email/UserID (AKTUALISIEREN!)
        playerName, // C: Name (AKTUALISIEREN!)
        ggpokerNickname, // D: GGPoker (AKTUALISIEREN!)
        discord, // E: Discord (AKTUALISIEREN!)
        currentRow[5], // F: Bankroll (behalten)
        livestreamLink || currentRow[6], // G: Livestream (AKTUALISIEREN wenn vorhanden)
        new Date().toISOString().split("T")[0], // H: Verification (aktualisieren)
        new Date().toISOString().split("T")[0], // I: Last Updated (aktualisieren)
      ];

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: SHEET_ID,
        range: `Leaderboard!A${rowIndex + 2}:I${rowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedRow] },
      });

      console.log(`✅ Leaderboard aktualisiert: ${playerName}`);
      return true;
    }
  } catch (error) {
    console.error("❌ Fehler beim Aktualisieren Leaderboard:", error);
    return false;
  }
}

// Kopiere Eintrag in Bankroll-Updates Sheet
async function copyToBankrollUpdates(
  sheets: any,
  auth: any,
  registrationRow: string[]
): Promise<boolean> {
  try {
    const playerId = registrationRow[0];
    const playerName = registrationRow[1];
    const playerEmail = registrationRow[2]; // Email aus Registration

    console.log(`\n➕ Erstelle Bankroll-Update für ${playerName}...`);

    const newRow = [
      Date.now().toString() + Math.random().toString(36).substr(2, 9), // Neue eindeutige ID
      playerEmail, // B: UserID = Email!
      playerName, // C: UserName
      INITIAL_BANKROLL.toString(), // D: Bankroll (initial start)
      "Initiale Bankroll beim Beitritt", // E: Notes
      new Date().toISOString().split("T")[0], // F: CreatedAt (Datum nur)
      "approved", // G: Status (Auto-Approved für Initial)
      "System", // H: ApprovedBy
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Bankroll-Updates!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    console.log(`✅ Bankroll-Update erstellt: ${playerName} (${playerEmail}) → €${INITIAL_BANKROLL}`);
    return true;
  } catch (error) {
    console.error("❌ Fehler beim Erstellen Bankroll-Update:", error);
    return false;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    console.log(`\n🔍 PUT: Verarbeite Registration ID "${id}"`);
    console.log(`📝 Updates: ${JSON.stringify(updates)}`);

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Google Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Hole die Registration aus dem Sheet
    // Struktur: A=ID, B=Name, C=Email, D=GGPoker, E=Discord, F=Livestream, G=CreatedAt, H=Status, I=ApprovedBy
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Registrierungen!A2:I1000",
    });

    const rows = response.data.values || [];
    console.log(`📊 Suche nach Registration ID: "${id}" in ${rows.length} Reihen`);

    const rowIndex = rows.findIndex((row: string[]) => {
      const regId = row[0]?.toString().trim();
      return regId === id.toString().trim();
    });

    if (rowIndex === -1) {
      console.error(`❌ Registration ID "${id}" nicht gefunden`);
      console.log(`📋 Erste 5 IDs im Sheet:`, rows.slice(0, 5).map(r => r[0]));
      return NextResponse.json(
        { error: "Registration not found", id },
        { status: 404 }
      );
    }

    console.log(`✅ Registration gefunden bei Index ${rowIndex}`);

    const currentRow = rows[rowIndex];
    const playerId = currentRow[0]; // ID
    const playerName = currentRow[1]; // Name
    const playerEmail = currentRow[2]; // Email
    const ggpokerNickname = currentRow[3]; // GGPoker
    const discord = currentRow[4]; // Discord
    const livestreamLink = currentRow[5]; // Livestream

    console.log(`\n📋 Registration Daten:`);
    console.log(`   ID: ${playerId}`);
    console.log(`   Name: ${playerName}`);
    console.log(`   Email: ${playerEmail}`);
    console.log(`   Discord: ${discord}`);
    console.log(`   GGPoker: ${ggpokerNickname}`);
    console.log(`   Livestream: ${livestreamLink}`);

    // Aktualisiere Status in Registrierungen Sheet
    const updatedRow = [
      currentRow[0], // A: ID
      currentRow[1], // B: Name
      currentRow[2], // C: Email
      currentRow[3], // D: GGPoker
      currentRow[4], // E: Discord
      currentRow[5], // F: Livestream
      currentRow[6], // G: CreatedAt
      updates.status || currentRow[7], // H: Status
      updates.approvedBy || currentRow[8], // I: ApprovedBy
    ];

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `Registrierungen!A${rowIndex + 2}:I${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] },
    });

    console.log(`✅ Status in Registrierungen aktualisiert: ${updates.status}`);

    // Wenn Status "approved", aktualisiere Leaderboard + Bankroll-Updates
    if (updates.status === "approved") {
      console.log(`\n🚀 GENEHMIGT! Starte Daten-Transfer...`);

      const leaderboardSuccess = await updateLeaderboard(sheets, auth, currentRow);
      const bankrollSuccess = await copyToBankrollUpdates(sheets, auth, currentRow);

      if (leaderboardSuccess && bankrollSuccess) {
        console.log(`\n🎉 ✅ ERFOLG: "${playerName}" (${playerEmail}) wurde komplett verarbeitet!\n`);
        return NextResponse.json({
          success: true,
          id,
          status: updates.status,
          message: `Spieler ${playerName} (${playerEmail}) wurde genehmigt und zu Leaderboard + Bankroll-Updates übertragen`,
          data: {
            playerId,
            playerName,
            playerEmail,
            discord,
          },
        });
      } else {
        console.error(`\n⚠️  WARNUNG: Nicht alle Sheets konnten aktualisiert werden`);
        return NextResponse.json(
          {
            success: false,
            id,
            status: updates.status,
            message: "Teilweise Fehler beim Transfer",
            details: {
              leaderboardSuccess,
              bankrollSuccess,
            },
          },
          { status: 207 }
        );
      }
    }

    // Wenn Status "rejected"
    if (updates.status === "rejected") {
      console.log(`\n❌ Registrierung "${playerName}" wurde abgelehnt`);
      return NextResponse.json({
        success: true,
        id,
        status: updates.status,
        message: `Registrierung von ${playerName} wurde abgelehnt`,
      });
    }

    return NextResponse.json({
      success: true,
      id,
      status: updates.status,
    });
  } catch (error) {
    console.error("❌ PUT Error:", error);
    return NextResponse.json(
      { error: String(error), details: JSON.stringify(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`\n🗑️ DELETE: Lösche Registration ID "${id}"`);

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Registrierungen!A2:I1000",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === id);

    if (rowIndex === -1) {
      console.error(`❌ Registration ID "${id}" nicht gefunden`);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Finde die korrekte SheetId für Registrierungen
    const sheetId = await getSheetId(auth, "Registrierungen");
    if (sheetId === null) {
      console.error("❌ Konnte SheetId für 'Registrierungen' nicht finden");
      return NextResponse.json(
        { error: "Could not find sheet" },
        { status: 500 }
      );
    }

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

    console.log(`✅ Registration gelöscht!\n`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}