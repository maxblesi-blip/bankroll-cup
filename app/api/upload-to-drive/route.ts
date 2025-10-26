import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

const BANKROLL_FOLDER_ID = "17bRf-VSkHAOcy81Vp-ossv6MPwVeqBxI";

async function getAuthClient() {
  try {
    const key = JSON.parse(process.env.GOOGLE_SHEETS_API_KEY || "{}");
    
    if (!key.type) {
      throw new Error("GOOGLE_SHEETS_API_KEY not configured");
    }

    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });
  } catch (error) {
    console.error("❌ [AUTH] Error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("📸 [UPLOAD] Request started");
    console.log("═══════════════════════════════════════════");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const discordId = formData.get("discordId") as string;
    const playerName = formData.get("playerName") as string;
    const entryId = formData.get("entryId") as string;

    console.log("📥 [PARAMS]");
    console.log(`   • Discord ID: ${discordId}`);
    console.log(`   • Player Name: ${playerName}`);
    console.log(`   • Entry ID: ${entryId}`);
    console.log(`   • File: ${file?.name} (${file?.size} bytes)`);

    // ✅ Validate
    if (!file || !discordId || !playerName || !entryId) {
      console.error("❌ [VALIDATION] Missing parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // ✅ Auth
    console.log("🔐 [AUTH] Authenticating...");
    const auth = await getAuthClient();
    console.log("✅ [AUTH] Success");

    // ✅ Init Drive
    const drive = google.drive("v3");
    const fileName = `[${discordId}] ${playerName} ${entryId}.jpg`;

    // ✅ Convert File to Buffer
    console.log("🔄 [CONVERT] Converting file to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ [CONVERT] Buffer ready: ${buffer.length} bytes`);

    // ✅ Convert Buffer to Readable Stream
    console.log("🔄 [STREAM] Creating readable stream...");
    const stream = Readable.from(buffer);

    // ✅ Upload
    console.log(`📤 [UPLOAD] Uploading: ${fileName}`);
    const uploadResponse = await drive.files.create({
      auth,
      requestBody: {
        name: fileName,
        mimeType: "image/jpeg",
        description: `Bankroll Update - ${playerName}`,
        parents: [BANKROLL_FOLDER_ID],
      },
      media: {
        mimeType: "image/jpeg",
        body: stream,
      },
    });

    const fileId = uploadResponse.data.id;
    console.log(`✅ [UPLOAD] File uploaded: ${fileId}`);

    // ✅ Make Public
    console.log("🔓 [PERMISSIONS] Making public...");
    await drive.permissions.create({
      auth,
      fileId: fileId!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    console.log("✅ [PERMISSIONS] Public readable");

    // ✅ Create Links
    const viewLink = `https://drive.google.com/file/d/${fileId}/view`;
    const downloadLink = `https://drive.google.com/uc?id=${fileId}&export=download`;

    console.log("═══════════════════════════════════════════");
    console.log("✅ [SUCCESS] Upload complete!");
    console.log(`   • View: ${viewLink}`);
    console.log("═══════════════════════════════════════════");

    return NextResponse.json(
      {
        success: true,
        fileId: fileId,
        fileName: fileName,
        fileLink: viewLink,
        downloadLink: downloadLink,
        message: "Uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("═══════════════════════════════════════════");
    console.error("❌ [ERROR] Upload failed!");
    console.error(`   • ${String(error)}`);
    console.error("═══════════════════════════════════════════");

    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Upload failed",
      },
      { status: 500 }
    );
  }
}

// ✅ Reject other methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}