// app/api/bankroll-updates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1i5nEi_FP0a6zv4jOD6oGIlSudc8doo4LqlxJAL7DV58";
const SHEET_NAME = "Bankroll-Updates";

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
    console.log("📊 GET: Lade alle Bankroll-Updates...");

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:H1000`,
    });

    const rows = response.data.values || [];
    console.log(`✅ ${rows.length} Einträge geladen`);

    const updates = rows
      .filter((row: string[]) => row[0]) // Nur mit ID
      .map((row: string[]) => ({
        id: row[0] || "",
        userEmail: row[1] || "", // B: Email
        userName: row[2] || "", // C: UserName
        bankroll: parseFloat(row[3]) || 0,
        notes: row[4] || "",
        createdAt: row[5] || "",
        status: row[6] || "pending",
        approvedBy: row[7] || "",
      }));

    return NextResponse.json(updates);
  } catch (error) {
    console.error("❌ GET Error:", error);
    return NextResponse.json(
      { error: "Error fetching bankroll updates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    console.log(`\n📝 POST: Neuer Bankroll-Update`);
    console.log(`   Spieler: ${update.userName}`);
    console.log(`   Email: ${update.userEmail}`);
    console.log(`   Bankroll: €${update.bankroll}`);

    // Validierung - nutze ECHTE EMAIL, nicht Discord ID!
    if (
      !update.userEmail ||
      !update.userName ||
      update.bankroll === undefined
    ) {
      console.error("❌ Fehlende erforderliche Felder");
      console.error(`   userEmail: ${update.userEmail}`);
      console.error(`   userName: ${update.userName}`);
      console.error(`   bankroll: ${update.bankroll}`);
      return NextResponse.json(
        { error: "Email, UserName und Bankroll sind erforderlich" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    if (!auth) {
      console.error("❌ Google Auth fehlgeschlagen");
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const sheets = google.sheets("v4");

    // Generiere eindeutige ID
    const newId =
      Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // ✅ STRUKTUR: A=ID, B=Email, C=UserName, D=Bankroll, E=Notes, F=CreatedAt, G=Status, H=ApprovedBy
    const newRow = [
      newId, // A: ID
      update.userEmail, // B: Email (ECHTE EMAIL!)
      update.userName, // C: UserName
      update.bankroll, // D: Bankroll
      update.notes || "", // E: Notes
      update.createdAt || new Date().toISOString().split("T")[0], // F: CreatedAt
      update.status || "pending", // G: Status
      update.approvedBy || "", // H: ApprovedBy
    ];

    console.log(`📝 Speichere Reihe:`);
    console.log(`   [${newRow.join(", ")}]`);

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:H`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    console.log(`✅ Bankroll-Update gespeichert mit ID: ${newId}`);
    console.log(
      `   Spieler: ${update.userName}`
    );
    console.log(`   Email: ${update.userEmail}`);
    console.log(`   Bankroll: €${update.bankroll}\n`);

    return NextResponse.json(
      {
        success: true,
        id: newId,
        message: `Bankroll-Update für ${update.userName} gespeichert!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}