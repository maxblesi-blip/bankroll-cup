// app/api/registrations/route.ts
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

export async function GET() {
  try {
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
    const registrations = rows
      .filter((row: string[]) => row[0]) // Nur Zeilen mit ID
      .map((row: string[]) => ({
        id: row[0] || "",
        name: row[1] || "",
        email: row[2] || "",
        ggpokerNickname: row[3] || "",
        discord: row[4] || "",
        livestreamLink: row[5] || "",
        createdAt: row[6] || "",
        status: row[7] || "pending",
        approvedBy: row[8] || "",
      }));

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("❌ GET Error:", error);
    return NextResponse.json({ error: "Error fetching registrations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const registration = await request.json();

    console.log(`📝 POST: Neue Registration von ${registration.name}`);

    // Validierung
    if (!registration.name || !registration.email || !registration.ggpokerNickname) {
      console.error("❌ Fehlende erforderliche Felder");
      return NextResponse.json(
        { error: "Name, Email und GGPoker Nickname sind erforderlich" },
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
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const newRow = [
      newId, // ID
      registration.name, // Name
      registration.email, // Email
      registration.ggpokerNickname, // GGPoker Nickname
      registration.discord || "", // Discord
      registration.livestreamLink || "", // Livestream Link
      new Date().toISOString().split("T")[0], // CreatedAt (Datum)
      "pending", // Status (initial)
      "", // ApprovedBy (leer bis genehmigt)
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Registrierungen!A2:I",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    console.log(`✅ Registration gespeichert mit ID: ${newId}`);

    return NextResponse.json(
      {
        success: true,
        id: newId,
        message: `Registrierung für ${registration.name} gespeichert!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}