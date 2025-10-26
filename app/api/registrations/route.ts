import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1i5nEi_FP0a6zv4jOD6oGIlSudc8doo4LqlxJAL7DV58';

async function getAuthClient() {
  try {
    const key = JSON.parse(process.env.GOOGLE_SHEETS_API_KEY || '{}');
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } catch (error) {
    console.error('❌ Auth Error:', error);
    return null;
  }
}

// ✅ GET - Hole alle Registrierungen
export async function GET() {
  try {
    console.log('📋 [GET] Lade alle Registrierungen...');

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }

    const sheets = google.sheets('v4');

    // ✅ Lese vom Sheet
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: 'Registrierungen!A2:J1000',
    });

    const rows = response.data.values || [];
    console.log(`✅ [GET] ${rows.length} Registrierungen geladen`);

    // ✅ Konvertiere zu Registration-Format
    const registrations = rows.map((row: string[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      email: row[2] || '',
      ggpokerNickname: row[3] || '',
      discord: row[4] || '',
      livestreamLink: row[5] || '',
      discordId: row[6] || '',
      createdAt: row[7] || new Date().toISOString(),
      status: (row[8] || 'pending').toLowerCase(),
      approvedBy: row[9] || '',
      bankroll: 0,
      experience: 'beginner',
    }));

    console.log('📤 [GET] Response:', registrations);
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('❌ [GET] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ✅ POST - Erstelle neue Registrierung
export async function POST(request: NextRequest) {
  try {
    const registration = await request.json();

    console.log('📝 [POST] Neue Registrierung:', registration);

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }

    const sheets = google.sheets('v4');

    // ✅ Hole bestehende Registrierungen
    const getResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: 'Registrierungen!A2:C1000',
    });

    const existingRows = getResponse.data.values || [];

    // ✅ Prüfe ob Email bereits existiert
    const existingRowIndex = existingRows.findIndex(
      (row: string[]) => row[2]?.toLowerCase() === registration.email?.toLowerCase()
    );

    // ✅ Vorbereiten der Daten
    const updatedRow = [
      registration.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      registration.name,
      registration.email,
      registration.ggpokerNickname,
      registration.discord || '',
      registration.livestreamLink || '',
      registration.discordId || '', // ✅ Discord ID
      new Date().toISOString().split('T')[0],
      registration.status || 'pending',
      registration.approvedBy || '',
    ];

    if (existingRowIndex !== -1) {
      // ✅ UPDATE: Email existiert bereits
      console.log(`♻️  UPDATE Registrierung für ${registration.email}`);

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: SHEET_ID,
        range: `Registrierungen!A${existingRowIndex + 2}:J${existingRowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
      });
    } else {
      // ✅ INSERT: Neue Registrierung
      console.log(`✨ INSERT neue Registrierung für ${registration.email}`);

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: SHEET_ID,
        range: 'Registrierungen!A2:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
      });
    }

    console.log(`✅ [POST] Registrierung gespeichert`);

    return NextResponse.json(
      {
        success: true,
        id: updatedRow[0],
        message: existingRowIndex !== -1 ? 'Registrierung aktualisiert' : 'Registrierung erstellt',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [POST] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ✅ PUT - Update Registrierung (Status ändern)
export async function PUT(request: NextRequest) {
  try {
    const { id, status, rejectedBy, rejectedAt, approvedBy, approvedAt } = await request.json();

    console.log(`📝 [PUT] Update Registrierung ${id}: status=${status}`);

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID und Status erforderlich' },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }

    const sheets = google.sheets('v4');

    // ✅ Hole alle Registrierungen
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: 'Registrierungen!A2:J1000',
    });

    const rows = response.data.values || [];

    // ✅ Finde die Registrierung
    const rowIndex = rows.findIndex((row: string[]) => row[0]?.toString() === id.toString());

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Registrierung nicht gefunden' }, { status: 404 });
    }

    const currentRow = rows[rowIndex];

    // ✅ Update Row
    const updatedRow = [
      currentRow[0], // ID behalten
      currentRow[1], // Name behalten
      currentRow[2], // Email behalten
      currentRow[3], // GGPoker behalten
      currentRow[4], // Discord behalten
      currentRow[5], // Livestream behalten
      currentRow[6], // Discord ID behalten
      currentRow[7], // CreatedAt behalten
      status, // Status UPDATE
      status === 'rejected' ? rejectedBy : approvedBy || currentRow[9], // ApprovedBy/RejectedBy
    ];

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SHEET_ID,
      range: `Registrierungen!A${rowIndex + 2}:J${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    });

    console.log(`✅ [PUT] Status geändert zu ${status}`);

    return NextResponse.json(
      {
        success: true,
        message: `Status zu ${status} geändert`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [PUT] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ✅ DELETE - Lösche Registrierung
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    console.log(`🗑️  [DELETE] Lösche Registrierung ${id}`);

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }

    const sheets = google.sheets('v4');

    // ✅ Hole alle Registrierungen
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SHEET_ID,
      range: 'Registrierungen!A2:J1000',
    });

    const rows = response.data.values || [];

    // ✅ Finde die Registrierung
    const rowIndex = rows.findIndex((row: string[]) => row[0]?.toString() === id.toString());

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Registrierung nicht gefunden' }, { status: 404 });
    }

    // ✅ Lösche die Reihe (clear)
    await sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId: SHEET_ID,
      range: `Registrierungen!A${rowIndex + 2}:J${rowIndex + 2}`,
    });

    console.log(`✅ [DELETE] Registrierung gelöscht`);

    return NextResponse.json(
      {
        success: true,
        message: 'Registrierung gelöscht',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [DELETE] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}