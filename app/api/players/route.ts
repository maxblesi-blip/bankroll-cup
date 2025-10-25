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
    console.error("Auth error:", error);
    return null;
  }
}

const SHEET_NAME = "Spieler";

// Neue Funktion: Finde die sheetId basierend auf dem Sheet Namen
async function getSheetId(auth: any): Promise<number | null> {
  try {
    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    const sheet = response.data.sheets?.find(
      (s: any) => s.properties?.title === SHEET_NAME
    );
    return sheet?.properties?.sheetId ?? null;
  } catch (error) {
    console.error("Error getting sheet ID:", error);
    return null;
  }
}

export async function GET() {
  try {
    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:F1000`,
    });

    const rows = response.data.values || [];
    const players = rows
      .filter((row: string[]) => row[0])
      .map((row: string[]) => ({
        id: row[0] || "",
        name: row[1] || "",
        ggpokerNickname: row[2] || "",
        bankroll: parseFloat(row[3]) || 0,
        livestreamLink: row[4] || "",
        lastVerification: row[5] || "",
      }));

    return NextResponse.json(players);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Error fetching" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const player = await request.json();
    const auth = await getAuthClient();

    if (!auth) {
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");
    const values = [
      [
        player.id,
        player.name,
        player.ggpokerNickname,
        player.bankroll,
        player.livestreamLink,
        player.lastVerification,
      ],
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:F`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Error saving player" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const player = await request.json();
    const auth = await getAuthClient();

    if (!auth) {
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:F1000`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === player.id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex + 2}:F${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            player.id,
            player.name,
            player.ggpokerNickname,
            player.bankroll,
            player.livestreamLink,
            player.lastVerification,
          ],
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Error updating" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const auth = await getAuthClient();

    if (!auth) {
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Hole alle Daten um die Reihenfolge zu finden
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A2:F1000`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // ✅ KORREKTUR: Ermittle die sheetId dynamisch
    const sheetId = await getSheetId(auth);
    if (sheetId === null) {
      return NextResponse.json(
        { error: "Could not find sheet" },
        { status: 500 }
      );
    }

    await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,  // ✅ Jetzt dynamisch!
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Error deleting" }, { status: 500 });
  }
}