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

    console.log(`📝 POST: Registration von ${registration.name} (Email: ${registration.email})`);

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

    // ✅ Hole alle bestehenden Registrierungen
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: "Registrierungen!A2:I1000",
    });

    const rows = response.data.values || [];
    console.log(`📋 Gefunden ${rows.length} bestehende Registrierungen`);

    // ✅ Prüfe ob Email bereits existiert (Spalte C, Index 2)
    const existingRowIndex = rows.findIndex((row: string[]) => {
      const rowEmail = row[2]?.toString().toLowerCase().trim() || "";
      const checkEmail = registration.email.toLowerCase().trim();
      return rowEmail === checkEmail;
    });

    // ✅ Datensatz vorbereiten
    const updatedRow = [
      registration.id || Date.now().toString() + Math.random().toString(36).substr(2, 9), // A: ID
      registration.name, // B: Name
      registration.email, // C: Email
      registration.ggpokerNickname, // D: GGPoker Nickname
      registration.discord || "", // E: Discord Username
      registration.livestreamLink || "", // F: Livestream Link
      registration.discordId || "", // G: Discord ID ✅ NEU!
      new Date().toISOString().split("T")[0], // H: CreatedAt (Datum)
      registration.status || "pending", // I: Status
      "", // J: ApprovedBy
    ];

    if (existingRowIndex !== -1) {
      // ✅ UPDATE: Spieler existiert bereits
      console.log(`♻️  UPDATE: Email ${registration.email} existiert bereits bei Index ${existingRowIndex}`);

      const currentRow = rows[existingRowIndex];
      
      // Behalte bestimmte Felder wenn sie bereits vorhanden sind
      const finalRow = [
        currentRow[0] || updatedRow[0], // ID behalten
        updatedRow[1], // Name aktualisieren
        updatedRow[2], // Email
        updatedRow[3], // GGPoker aktualisieren
        updatedRow[4], // Discord aktualisieren
        updatedRow[5], // Livestream aktualisieren
        registration.discordId || currentRow[6] || "", // Discord ID aktualisieren oder behalten ✅
        currentRow[7] || updatedRow[7], // CreatedAt behalten (Original-Datum)
        currentRow[8] || updatedRow[8], // Status behalten (falls schon genehmigt)
        currentRow[9] || updatedRow[9], // ApprovedBy behalten
      ];

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: SHEET_ID,
        range: `Registrierungen!A${existingRowIndex + 2}:I${existingRowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [finalRow] },
      });

      console.log(`✅ Registration aktualisiert für ${registration.name} (${registration.email})`);

      return NextResponse.json(
        {
          success: true,
          id: currentRow[0],
          updated: true,
          message: `Registrierung für ${registration.name} aktualisiert!`,
        },
        { status: 200 }
      );
    } else {
      // ✅ INSERT: Neuer Spieler
      console.log(`✨ INSERT: Neue Registration für ${registration.email}`);

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: SHEET_ID,
        range: "Registrierungen!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedRow] },
      });

      console.log(`✅ Neue Registration gespeichert mit ID: ${updatedRow[0]}`);

      return NextResponse.json(
        {
          success: true,
          id: updatedRow[0],
          created: true,
          message: `Registrierung für ${registration.name} erstellt!`,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("❌ POST Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}