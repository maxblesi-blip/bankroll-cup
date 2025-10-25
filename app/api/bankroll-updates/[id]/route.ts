// app/api/bankroll-updates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1i5nEi_FP0a6zv4jOD6oGIlSudc8doo4LqlxJAL7DV58";
const SHEET_NAME = "Bankroll-Updates";
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

// ✅ Aktualisiere Bankroll im Leaderboard
async function updateLeaderboardBankroll(
  sheets: any,
  auth: any,
  userEmail: string,
  userName: string,
  newBankroll: number
): Promise<boolean> {
  try {
    console.log(`\n💰 [LEADERBOARD] Aktualisiere Bankroll...`);
    console.log(`   Email: ${userEmail}`);
    console.log(`   Name: ${userName}`);
    console.log(`   Neue Bankroll: €${newBankroll}`);

    // Hole Leaderboard Daten
    // Struktur: A=ID, B=Email, C=Name, D=GGPoker, E=Bankroll, F=Livestream, G=Verification, H=LastUpdated
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${LEADERBOARD_SHEET}!A2:H1000`,
    });

    const rows = response.data.values || [];
    console.log(`   📊 Gefunden ${rows.length} Spieler im Leaderboard`);

    // Suche nach Email in Spalte B (Index 1)
    const rowIndex = rows.findIndex((row: string[]) => {
      const rowEmail = row[1]?.toString().toLowerCase().trim() || "";
      const searchEmail = userEmail.toLowerCase().trim();
      return rowEmail === searchEmail;
    });

    if (rowIndex === -1) {
      console.error(`   ❌ Spieler mit Email "${userEmail}" NICHT gefunden!`);
      return false;
    }

    console.log(`   ✅ Spieler gefunden bei Reihe ${rowIndex + 2}`);

    const currentRow = rows[rowIndex];
    const oldBankroll = parseFloat(currentRow[4]) || 0;

    // Erstelle aktualisierte Reihe
    const updatedRow = [
      currentRow[0], // A: ID (behalten)
      currentRow[1], // B: Email (behalten)
      currentRow[2] || userName, // C: Name (ggf. aktualisieren)
      currentRow[3], // D: GGPoker (behalten)
      newBankroll.toString(), // E: Bankroll (AKTUALISIEREN!)
      currentRow[5], // F: Livestream (behalten)
      currentRow[6], // G: Verification (behalten)
      new Date().toISOString().split("T")[0], // H: Last Updated (aktualisieren)
    ];

    console.log(`   📝 Update Reihe ${rowIndex + 2}: €${oldBankroll} → €${newBankroll}`);

    // Update im Leaderboard Sheet
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${LEADERBOARD_SHEET}!A${rowIndex + 2}:H${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] },
    });

    console.log(`   ✅ Leaderboard erfolgreich aktualisiert!`);
    return true;
  } catch (error) {
    console.error("   ❌ Fehler beim Aktualisieren Leaderboard:", error);
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

    console.log(`\n🔍 [PUT] Bankroll-Update ID: "${id}"`);
    console.log(`📝 Status: ${updates.status}`);

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Google Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Hole alle Bankroll-Updates
    // Struktur: A=ID, B=UserEmail, C=UserName, D=Bankroll, E=Notes, F=CreatedAt, G=Status, H=ApprovedBy
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:H1000`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Gesamt Einträge: ${rows.length}`);

    // Suche nach ID in Spalte A (Index 0)
    const rowIndex = rows.findIndex((row: string[]) => {
      return row[0]?.toString().trim() === id.toString().trim();
    });

    if (rowIndex === -1) {
      console.error(`❌ Update ID "${id}" nicht gefunden`);
      return NextResponse.json(
        { error: "Update not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Update gefunden bei Index ${rowIndex}`);

    const currentRow = rows[rowIndex];
    const userEmail = currentRow[1]; // B: Email
    const userName = currentRow[2]; // C: Name
    const bankroll = parseFloat(currentRow[3]) || 0; // D: Bankroll

    console.log(`   Spieler: ${userName} (${userEmail})`);
    console.log(`   Bankroll: €${bankroll}`);

    // Aktualisiere Status im Bankroll-Updates Sheet
    const updatedRow = [
      currentRow[0], // A: ID
      currentRow[1], // B: Email
      currentRow[2], // C: Name
      currentRow[3], // D: Bankroll
      currentRow[4], // E: Notes
      currentRow[5], // F: CreatedAt
      updates.status || currentRow[6], // G: Status (AKTUALISIEREN!)
      updates.approvedBy || currentRow[7], // H: ApprovedBy (AKTUALISIEREN!)
    ];

    console.log(`📝 Aktualisiere Status in Bankroll-Updates Sheet...`);

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex + 2}:H${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] },
    });

    console.log(`✅ Status aktualisiert zu: ${updates.status}`);

    // ✅ WICHTIG: Wenn Status "approved", aktualisiere Leaderboard!
    if (updates.status === "approved") {
      console.log(`\n🚀 [APPROVED] Trigger Leaderboard Update...`);

      const leaderboardSuccess = await updateLeaderboardBankroll(
        sheets,
        auth,
        userEmail,
        userName,
        bankroll
      );

      if (!leaderboardSuccess) {
        console.warn(`⚠️  Warnung: Leaderboard Update fehlgeschlagen`);
        return NextResponse.json(
          {
            success: false,
            id,
            status: updates.status,
            message: "Update genehmigt, aber Leaderboard Update fehlgeschlagen",
          },
          { status: 207 }
        );
      }

      console.log(`\n🎉 SUCCESS: Bankroll Update genehmigt und Leaderboard aktualisiert!`);
      console.log(`   ${userName}: €${bankroll}\n`);

      return NextResponse.json({
        success: true,
        id,
        status: updates.status,
        message: `Bankroll Update genehmigt und Leaderboard aktualisiert zu €${bankroll}`,
      });
    }

    console.log(`✅ Update verarbeitet: ${updates.status}\n`);
    return NextResponse.json({
      success: true,
      id,
      status: updates.status,
      message: `Update auf "${updates.status}" gesetzt`,
    });
  } catch (error) {
    console.error("❌ PUT Error:", error);
    return NextResponse.json(
      { error: String(error) },
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
    console.log(`\n🗑️ DELETE: Bankroll-Update ID "${id}"`);

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Google Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Hole alle Einträge
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:H1000`,
    });

    const rows = response.data.values || [];

    // Suche nach ID
    const rowIndex = rows.findIndex((row: string[]) => {
      return row[0]?.toString().trim() === id.toString().trim();
    });

    if (rowIndex === -1) {
      console.error(`❌ Update ID "${id}" nicht gefunden`);
      return NextResponse.json(
        { error: "Update not found" },
        { status: 404 }
      );
    }

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

    console.log(`✅ Update gelöscht!\n`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}