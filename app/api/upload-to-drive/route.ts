import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const BANKROLL_FOLDER_ID = "17bRf-VSkHAOcy81Vp-ossv6MPwVeqBxI";

async function getAuthClient() {
  try {
    const key = JSON.parse(process.env.GOOGLE_SHEETS_API_KEY || "{}");
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });
  } catch (error) {
    console.error("❌ Auth Error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const discordId = formData.get("discordId") as string;
    const playerName = formData.get("playerName") as string;
    const entryId = formData.get("entryId") as string;

    console.log(`📸 Upload to Google Drive:`);
    console.log(`   Discord ID: ${discordId}`);
    console.log(`   Player Name: ${playerName}`);
    console.log(`   Entry ID: ${entryId}`);

    if (!file || !discordId || !playerName || !entryId) {
      return NextResponse.json(
        { error: "Fehlende Parameter" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    if (!auth) {
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }

    const drive = google.drive("v3");
    const fileName = `[${discordId}] ${playerName} ${entryId}.jpg`;
    const buffer = await file.arrayBuffer();

    const uploadResponse = await drive.files.create({
      auth,
      requestBody: {
        name: fileName,
        mimeType: "image/jpeg",
        description: `Bankroll Update Proof - ${playerName}`,
        parents: [BANKROLL_FOLDER_ID],
      },
      media: {
        mimeType: "image/jpeg",
        body: Buffer.from(buffer),
      },
    });

    const fileId = uploadResponse.data.id;
    console.log(`✅ File hochgeladen: ${fileId}`);

    await drive.permissions.create({
      auth,
      fileId: fileId!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const viewLink = `https://drive.google.com/file/d/${fileId}/view`;

    return NextResponse.json(
      {
        success: true,
        fileId: fileId,
        fileName: fileName,
        fileLink: viewLink,
        message: "Datei erfolgreich hochgeladen",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Upload Error:", error);
    return NextResponse.json(
      {
        error: String(error),
        message: "Fehler beim Upload",
      },
      { status: 500 }
    );
  }
}