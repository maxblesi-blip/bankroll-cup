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
    throw error;
  }
}

export async function GET() {
  try {
    console.log("📊 [BANKROLL-UPDATES] GET Request");

    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:K",
    });

    const rows = response.data.values || [];
    console.log(`✅ Retrieved ${rows.length} rows from Bankroll-Updates`);

    const updates = rows.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      userId: row[1] || "",
      userName: row[2] || "",
      discordId: row[3] || "",
      bankroll: row[4] ? parseFloat(row[4]) : 0,
      notes: row[5] || "",
      proofImageUrl: row[6] || "",
      status: row[7] || "pending",
      createdAt: row[8] || "",
      approvedBy: row[9] || "",
      approvedAt: row[10] || "",
    }));

    return NextResponse.json(updates, { status: 200 });
  } catch (error) {
    console.error("❌ GET Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("💾 [BANKROLL-UPDATE] POST Request");
    console.log("═══════════════════════════════════════════");

    const body = await request.json();
    console.log("📥 Received data:");
    console.log(`   • userId: ${body.userId}`);
    console.log(`   • userName: ${body.userName}`);
    console.log(`   • bankroll: ${body.bankroll}`);
    console.log(`   • discordId: ${body.discordId}`);
    console.log(`   • status: ${body.status}`);
    console.log(`   • proofImageUrl: ${body.proofImageUrl?.substring(0, 50)}...`);

    if (!body.userId || !body.userName || body.bankroll === undefined) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: userId, userName, bankroll" },
        { status: 400 }
      );
    }

    console.log("🔐 [AUTH] Authenticating with Google Sheets...");
    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    const timestamp = new Date().toISOString();
    const entryId = `${body.userId}-${Date.now()}`;
    const values = [
      [
        entryId, // A: ID
        body.userId, // B: userId
        body.userName, // C: userName
        body.discordId || "", // D: discordId
        body.bankroll, // E: bankroll
        body.notes || "", // F: notes
        body.proofImageUrl || "", // G: proofImageUrl
        body.status || "pending", // H: status
        timestamp, // I: createdAt
        "", // J: approvedBy
        "", // K: approvedAt
      ],
    ];

    console.log("📝 [APPEND] Adding row to Bankroll-Updates sheet...");

    const response = await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:K",
      valueInputOption: "RAW",
      requestBody: {
        values: values,
      },
    });

    console.log("✅ [APPEND] Row added successfully!");
    console.log(`   • Updates: ${response.data.updates?.updatedRows}`);
    console.log(`   • Range: ${response.data.updates?.updatedRange}`);

    console.log("═══════════════════════════════════════════");
    console.log("✅ [SUCCESS] Bankroll update saved!");
    console.log("═══════════════════════════════════════════");

    return NextResponse.json(
      {
        success: true,
        message: "Bankroll update saved successfully",
        updatedRows: response.data.updates?.updatedRows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("═══════════════════════════════════════════");
    console.error("❌ [ERROR] Failed to save bankroll update");
    console.error(`   • ${String(error)}`);
    console.error("═══════════════════════════════════════════");

    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Failed to save bankroll update",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("✏️ [BANKROLL-UPDATE] PUT Request");

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      console.error("❌ Missing id or status");
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:K",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any[]) => row[0] === id) + 1;

    if (rowIndex === 0) {
      console.error("❌ Bankroll update not found:", id);
      return NextResponse.json(
        { error: "Bankroll update not found" },
        { status: 404 }
      );
    }

    const currentRow = rows[rowIndex - 1];
    const updatedRow = [
      currentRow[0], // A: id
      currentRow[1], // B: userId
      currentRow[2], // C: userName
      currentRow[3], // D: discordId
      currentRow[4], // E: bankroll
      currentRow[5], // F: notes
      currentRow[6], // G: proofImageUrl
      status, // H: status (UPDATED!)
      currentRow[8], // I: createdAt
      currentRow[9], // J: approvedBy
      currentRow[10], // K: approvedAt
    ];

    console.log(`✏️ [UPDATE] Row ${rowIndex}: Status → ${status}`);

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `'Bankroll-Updates'!A${rowIndex}:K${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [updatedRow],
      },
    });

    console.log(`✅ [UPDATE] Status aktualisiert zu: ${status}`);

    return NextResponse.json(
      { success: true, message: "Status updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ PUT Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, discordId } = body;

    console.log(`\n🗑️ DELETE: Lösche Bankroll Update`);
    console.log(`   ID: ${id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Discord ID: ${discordId}`);

    if (!id && !email && !discordId) {
      console.error(`❌ Keine ID, Email oder Discord ID im Request Body`);
      return NextResponse.json(
        { error: "ID, Email or Discord ID required" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:K",
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    // PRIMÄR: Suche nach Discord ID (Spalte D, Index 3)
    if (discordId) {
      rowIndex = rows.findIndex((row: any[]) => {
        const rowDiscordId = row[3]?.toString().trim();
        return rowDiscordId === discordId;
      });
      console.log(`   Suche nach Discord ID: ${rowIndex !== -1 ? "Gefunden" : "Nicht gefunden"}`);
    }

    // Fallback: Suche nach ID (Spalte A, Index 0)
    if (rowIndex === -1 && id) {
      rowIndex = rows.findIndex((row: any[]) => row[0] === id);
      console.log(`   Fallback nach ID: ${rowIndex !== -1 ? "Gefunden" : "Nicht gefunden"}`);
    }

    // Final Fallback: Suche nach Email (Spalte B, Index 1)
    if (rowIndex === -1 && email) {
      rowIndex = rows.findIndex((row: any[]) => {
        const rowEmail = row[1]?.toString().toLowerCase().trim();
        return rowEmail === email.toLowerCase().trim();
      });
      console.log(`   Fallback nach Email: ${rowIndex !== -1 ? "Gefunden" : "Nicht gefunden"}`);
    }

    if (rowIndex === -1) {
      console.error(`❌ Bankroll update nicht gefunden`);
      return NextResponse.json(
        { error: "Bankroll update not found" },
        { status: 404 }
      );
    }

    await sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId: SHEET_ID,
      range: `'Bankroll-Updates'!A${rowIndex + 1}:K${rowIndex + 1}`,
    });

    console.log(`✅ Bankroll update gelöscht (Reihe ${rowIndex + 1})`);

    return NextResponse.json(
      { success: true, message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ DELETE Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}