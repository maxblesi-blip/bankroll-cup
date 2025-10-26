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

    // ✅ Hole Leaderboard Daten
    const leaderResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Leaderboard!A2:L1000",
    });

    const leaderRows = leaderResponse.data.values || [];

    // ✅ Prüfe ob Spieler bereits im Leaderboard ist
    const playerRowIndex = leaderRows.findIndex(
      (row: string[]) => row[2]?.toLowerCase() === regRow[2]?.toLowerCase() // Email in Spalte C
    );

    // ✅ Vorbereitung der Leaderboard-Daten
    const leaderboardRow = [
      regRow[0], // ID
      regRow[1], // Name
      regRow[2], // Email
      regRow[3], // GGPoker Nickname
      0, // Bankroll (initial 0)
      0, // Position (wird berechnet)
      new Date().toISOString().split("T")[0], // CreatedAt
      "", // LastUpdate
      regRow[4] || "", // Discord Username (Spalte E aus Registrierung)
      regRow[6] || "", // Discord ID ✅ (Spalte G aus Registrierung)
      regRow[5] || "", // Livestream Link
      "", // Notes
    ];

    if (playerRowIndex !== -1) {
      // ✅ UPDATE: Spieler existiert bereits
      console.log(`♻️  UPDATE Leaderboard für ${regRow[1]}`);

      const currentLeaderRow = leaderRows[playerRowIndex];
      
      // Behalte Position und Bankroll, update Discord ID
      const updatedLeaderRow = [
        currentLeaderRow[0], // ID behalten
        leaderboardRow[1], // Name
        leaderboardRow[2], // Email
        leaderboardRow[3], // GGPoker
        currentLeaderRow[4], // Bankroll behalten
        currentLeaderRow[5], // Position behalten
        currentLeaderRow[6], // CreatedAt behalten
        currentLeaderRow[7], // LastUpdate behalten
        leaderboardRow[8], // Discord Username
        leaderboardRow[9], // Discord ID ✅ UPDATE
        leaderboardRow[10], // Livestream Link
        currentLeaderRow[11], // Notes behalten
      ];

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: SHEET_ID,
        range: `Leaderboard!A${playerRowIndex + 2}:L${playerRowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedLeaderRow] },
      });
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
    }

    // ✅ Update Registrierung Status
    const updatedRegRow = [
      regRow[0],
      regRow[1],
      regRow[2],
      regRow[3],
      regRow[4],
      regRow[5],
      regRow[6],
      regRow[7],
      "approved", // Status ✅
      approvedBy || "", // ApprovedBy
    ];

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `Registrierungen!A${registrationRowIndex + 2}:J${registrationRowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRegRow] },
    });

    console.log(`✅ Registration genehmigt und ins Leaderboard kopiert!`);

    return NextResponse.json(
      {
        success: true,
        message: `${regRow[1]} wurde genehmigt und ins Leaderboard aufgenommen!`,
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