// app/api/registrations/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1i5nEi_FP0a6zv4jOD6oGIlSudc8doo4LqlxJAL7DV58";

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
    const { registrationId, approvedBy } = await request.json();

    console.log(`📋 Approve Registration: ${registrationId} (By: ${approvedBy})`);

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID erforderlich" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // ✅ Hole Registrierung aus Registrierungen Sheet
    // Struktur: A=ID, B=Name, C=Email, D=GGPoker, E=Discord, F=Livestream, G=Discord ID, H=CreatedAt, I=Status, J=ApprovedBy
    const regResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Registrierungen!A2:J1000",
    });

    const regRows = regResponse.data.values || [];
    const registrationRowIndex = regRows.findIndex(
      (row: string[]) => row[0]?.toString() === registrationId.toString()
    );

    if (registrationRowIndex === -1) {
      return NextResponse.json(
        { error: "Registration nicht gefunden" },
        { status: 404 }
      );
    }

    const regRow = regRows[registrationRowIndex];
    console.log(`✅ Registration gefunden:`, regRow);

    // Registrierung Spalten:
    // [0]=ID, [1]=Name, [2]=Email, [3]=GGPoker, [4]=Discord Username, [5]=Livestream, [6]=Discord ID, [7]=CreatedAt, [8]=Status, [9]=ApprovedBy

    // ✅ Hole Leaderboard Daten
    const leaderResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Leaderboard!A2:L1000",
    });

    const leaderRows = leaderResponse.data.values || [];

    // ✅ Prüfe ob Spieler bereits im Leaderboard ist
    const playerRowIndex = leaderRows.findIndex(
      (row: string[]) => row[2]?.toLowerCase() === regRow[2]?.toLowerCase() // Email in Spalte C (Index 2)
    );

    // ✅ Vorbereitung der Leaderboard-Daten
    // Leaderboard Spalten: A=ID, B=Name, C=Email, D=GGPoker, E=Bankroll, F=Position, G=CreatedAt, H=LastUpdate, I=Discord Username, J=Discord ID, K=Livestream, L=Notes
    const leaderboardRow = [
      regRow[0], // A: ID
      regRow[1], // B: Name
      regRow[2], // C: Email
      regRow[3], // D: GGPoker Nickname
      "500", // E: Bankroll ✅ START mit 500€!
      "0", // F: Position (wird berechnet)
      new Date().toISOString().split("T")[0], // G: CreatedAt
      new Date().toISOString().split("T")[0], // H: LastUpdate
      regRow[4] || "", // I: Discord Username (aus Registrierung Spalte E)
      regRow[6] || "", // J: Discord ID ✅ (aus Registrierung Spalte G)
      regRow[5] || "", // K: Livestream Link (aus Registrierung Spalte F)
      "", // L: Notes
    ];

    console.log(`📝 Leaderboard Row:`, leaderboardRow);

    if (playerRowIndex !== -1) {
      // ✅ UPDATE: Spieler existiert bereits
      console.log(`♻️  UPDATE Leaderboard für ${regRow[1]}`);

      const currentLeaderRow = leaderRows[playerRowIndex];

      // Behalte Position und Bankroll, update nur Discord Daten
      const updatedLeaderRow = [
        currentLeaderRow[0], // A: ID behalten
        leaderboardRow[1], // B: Name
        leaderboardRow[2], // C: Email
        leaderboardRow[3], // D: GGPoker
        currentLeaderRow[4], // E: Bankroll behalten
        currentLeaderRow[5], // F: Position behalten
        currentLeaderRow[6], // G: CreatedAt behalten
        currentLeaderRow[7], // H: LastUpdate behalten
        leaderboardRow[8], // I: Discord Username
        leaderboardRow[9], // J: Discord ID ✅ UPDATE
        leaderboardRow[10], // K: Livestream Link
        currentLeaderRow[11], // L: Notes behalten
      ];

      console.log(`📝 Updated Row:`, updatedLeaderRow);

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: SHEET_ID,
        range: `Leaderboard!A${playerRowIndex + 2}:L${playerRowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedLeaderRow] },
      });

      console.log(`✅ Leaderboard aktualisiert`);
    } else {
      // ✅ INSERT: Neuer Spieler ins Leaderboard
      console.log(`✨ INSERT Leaderboard für ${regRow[1]}`);

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: SHEET_ID,
        range: "Leaderboard!A2:L",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [leaderboardRow] },
      });

      console.log(`✅ Neuer Spieler ins Leaderboard eingefügt`);
    }

    // ✅ Update Registrierung Status
    const updatedRegRow = [
      regRow[0], // A: ID
      regRow[1], // B: Name
      regRow[2], // C: Email
      regRow[3], // D: GGPoker
      regRow[4], // E: Discord
      regRow[5], // F: Livestream
      regRow[6], // G: Discord ID
      regRow[7], // H: CreatedAt
      "approved", // I: Status ✅
      approvedBy || "", // J: ApprovedBy
    ];

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `Registrierungen!A${registrationRowIndex + 2}:J${registrationRowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRegRow] },
    });

    console.log(`✅ Registrierungen Status aktualisiert`);

    console.log(`✅ Registration genehmigt und ins Leaderboard kopiert!\n`);

    return NextResponse.json(
      {
        success: true,
        message: `${regRow[1]} wurde genehmigt und ins Leaderboard aufgenommen mit 500€ Startbankroll!`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ POST Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}