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

    // ✅ Validate
    if (!body.userId || !body.userName || body.bankroll === undefined) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: userId, userName, bankroll" },
        { status: 400 }
      );
    }

    // ✅ Get Auth
    console.log("🔐 [AUTH] Authenticating with Google Sheets...");
    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    // ✅ Create entry
    const timestamp = new Date().toISOString();
const entryId = `${body.userId}-${Date.now()}`;
const values = [
  [
    entryId, // A: ID
    body.userId, // B: userId
    body.userName, // C: userName
    body.bankroll, // D: bankroll
    body.notes || "", // E: notes
    body.proofImageUrl || "", // F: proofImageUrl
    body.status || "pending", // G: status
    timestamp, // H: createdAt
    "", // I: approvedBy
    "", // J: approvedAt
  ],
];

    console.log("📝 [APPEND] Adding row to Bankroll-Updates sheet...");

    // ✅ Append to Sheet
    const response = await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:I",
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

export async function GET() {
  try {
    console.log("📊 [BANKROLL-UPDATES] GET Request");

    // ✅ Get Auth
    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    // ✅ Get data from Sheet
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:I",
    });

    const rows = response.data.values || [];
    console.log(`✅ Retrieved ${rows.length} rows from Bankroll-Updates`);

    // ✅ Convert to objects (skip header row)
    const updates = rows.slice(1).map((row: any[]) => ({
  id: row[0] || "",              // A: ID
  userId: row[1] || "",          // B: userId
  userName: row[2] || "",        // C: userName
  bankroll: row[3] ? parseFloat(row[3]) : 0,  // D: bankroll
  notes: row[4] || "",           // E: notes ✅ (war row[3]!)
  proofImageUrl: row[5] || "",   // F: proofImageUrl ✅ (war row[4]!)
  status: row[6] || "pending",   // G: status ✅ (war row[5]!)
  createdAt: row[7] || "",       // H: createdAt ✅ (war row[6]!)
  approvedBy: row[8] || "",      // I: approvedBy ✅ (war row[7]!)
  approvedAt: row[9] || "",      // J: approvedAt ✅ (war row[8]!)
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

export async function PUT(request: NextRequest) {
  try {
    console.log("✏️ [BANKROLL-UPDATE] PUT Request");

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    // ✅ Find row by userId
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:I",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any[]) => row[0] === userId) + 1;

    if (rowIndex === 0) {
      return NextResponse.json(
        { error: "Bankroll update not found" },
        { status: 404 }
      );
    }

    // ✅ Update row (✅ FIXED: removed unused variable)
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `'Bankroll-Updates'!A${rowIndex}:I${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            userId,
            updateData.userName || rows[rowIndex - 1][1],
            updateData.bankroll ?? rows[rowIndex - 1][2],
            updateData.notes || rows[rowIndex - 1][3],
            updateData.proofImageUrl || rows[rowIndex - 1][4],
            updateData.status || rows[rowIndex - 1][5],
            rows[rowIndex - 1][6],
            updateData.approvedBy || rows[rowIndex - 1][7],
            updateData.approvedAt || rows[rowIndex - 1][8],
          ],
        ],
      },
    });

    console.log("✅ Bankroll update updated");

    return NextResponse.json(
      { success: true, message: "Updated successfully" },
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    const sheets = google.sheets("v4");

    // ✅ Find and delete row
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "'Bankroll-Updates'!A:I",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any[]) => row[0] === userId) + 1;

    if (rowIndex === 0) {
      return NextResponse.json(
        { error: "Bankroll update not found" },
        { status: 404 }
      );
    }

    // ✅ Clear row (Google Sheets doesn't have true delete, we clear)
    await sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId: SHEET_ID,
      range: `'Bankroll-Updates'!A${rowIndex}:I${rowIndex}`,
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