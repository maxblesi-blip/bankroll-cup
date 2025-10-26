import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    console.log("🔍 DEBUG: Lese direkt von Google Sheets...");

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: "Auth failed - können Credentials nicht laden" }, { status: 500 });
    }

    const sheets = google.sheets("v4");
    
    console.log(`📋 Lese Sheet: ${SHEET_ID}`);
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Registrierungen!A1:J1000",
    });

    const rows = response.data.values || [];
    
    console.log(`📊 DEBUG: ${rows.length} Rows gefunden`);
    console.log("📋 Header Row:", rows[0]);
    console.log("📋 Erste Daten Row:", rows[1]);

    // Formatiere schöner
    const formattedRows = rows.slice(1).map((row, idx) => ({
      rowNumber: idx + 2,
      id: row[0],
      name: row[1],
      email: row[2],
      ggpokerNickname: row[3],
      discordUsername: row[4],
      livestreamLink: row[5],
      discordId: row[6],
      createdAt: row[7],
      status: row[8],
      approvedBy: row[9],
    }));

    return NextResponse.json({
      status: "ok",
      totalRows: rows.length,
      headerRow: rows[0],
      dataRows: formattedRows,
      firstDataRow: formattedRows[0] || null,
      message: `${rows.length - 1} Registrierungen gefunden (+ 1 Header)`,
    });
  } catch (error) {
    console.error("❌ DEBUG Error:", error);
    return NextResponse.json(
      { 
        error: String(error),
        message: "Fehler beim Lesen von Google Sheets",
        details: error instanceof Error ? error.message : null,
      },
      { status: 500 }
    );
  }
}