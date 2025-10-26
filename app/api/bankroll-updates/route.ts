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
      range: "'Bankroll-Updates'!A:J",
    });

    const rows = response.data.values || [];
    console.log(`✅ Retrieved ${rows.length} rows from Bankroll-Updates`);

    const updates = rows.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      userId: row[1] || "",
      userName: row[2] || "",
      bankroll: row[3] ? parseFloat(row[3]) : 0,
      notes: row[4] || "",
      proofImageUrl: row[5] || "",
      status: row[6] || "pending",
      createdAt: row[7] || "",
      approvedBy: row[8] || "",
      approvedAt: row[9] || "",
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
    body.discordId || "", // D: discordId ← NEU!
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
  range: "'Bankroll-Updates'!A:K",   ← A:K!
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
  range: "'Bankroll-Updates'!A:K",  // ← A:K
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
  currentRow[0],
  currentRow[1],
  currentRow[2],
  currentRow[3],  // ← discordId (wird mitgenommen)
  currentRow[4],
  currentRow[5],
  currentRow[6],
  status,  // ← Hier wird status aktualisiert (war Index 6, jetzt Index 7)
  currentRow[8],
  currentRow[9],
  currentRow[10],
];

    console.log(`✏️ [UPDATE] Row ${rowIndex}: Status → ${status}`);

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `'Bankroll-Updates'!A${rowIndex}:K${rowIndex}`,  // ← A:K
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
    console.log("🗑️ [BANKROLL-UPDATE] DELETE Request");

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id required" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    const response = await sheets.spreadsheets.values.get({
  auth,
  spreadsheetId: SHEET_ID,
  range: "'Bankroll-Updates'!A:K",  // ← A:K
});

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any[]) => row[0] === id) + 1;

    if (rowIndex === 0) {
      return NextResponse.json(
        { error: "Bankroll update not found" },
        { status: 404 }
      );
    }

    await sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId: SHEET_ID,
      range: `'Bankroll-Updates'!A${rowIndex}:K${rowIndex}`,  // ← A:K
    });

    console.log("✅ Bankroll update deleted");

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