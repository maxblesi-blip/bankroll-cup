import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// ✅ BANKROLL FOLDER ID
const BANKROLL_FOLDER_ID = "17bRf-VSkHAOcy81Vp-ossv6MPwVeqBxI";

// ✅ GET AUTH CLIENT
async function getAuthClient() {
  try {
    const key = JSON.parse(process.env.GOOGLE_SHEETS_API_KEY || "{}");
    
    if (!key.type) {
      throw new Error("GOOGLE_SHEETS_API_KEY not configured properly");
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

// ✅ MAIN POST HANDLER
export async function POST(request: NextRequest) {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("📸 [UPLOAD-TO-DRIVE] Request started");
    console.log("═══════════════════════════════════════════");

    // ✅ Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const discordId = formData.get("discordId") as string;
    const playerName = formData.get("playerName") as string;
    const entryId = formData.get("entryId") as string;

    console.log("📥 [PARAMS] Received:");
    console.log(`   • Discord ID: ${discordId}`);
    console.log(`   • Player Name: ${playerName}`);
    console.log(`   • Entry ID: ${entryId}`);
    console.log(`   • File Name: ${file?.name}`);
    console.log(`   • File Size: ${file?.size} bytes`);
    console.log(`   • File Type: ${file?.type}`);

    // ✅ Validate Parameters
    if (!file) {
      console.error("❌ [VALIDATION] No file provided");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!discordId || !playerName || !entryId) {
      console.error("❌ [VALIDATION] Missing required fields");
      console.log(`   • discordId: ${discordId}`);
      console.log(`   • playerName: ${playerName}`);
      console.log(`   • entryId: ${entryId}`);
      return NextResponse.json(
        { error: "Missing required parameters: discordId, playerName, entryId" },
        { status: 400 }
      );
    }

    // ✅ Get Auth Client
    console.log("🔐 [AUTH] Authenticating with Google...");
    const auth = await getAuthClient();
    if (!auth) {
      throw new Error("Failed to authenticate with Google");
    }
    console.log("✅ [AUTH] Authentication successful");

    // ✅ Initialize Drive API
    console.log("🚗 [DRIVE] Initializing Google Drive API...");
    const drive = google.drive("v3");

    // ✅ Create Filename
    const fileName = `[${discordId}] ${playerName} ${entryId}.jpg`;
    console.log(`📝 [FILENAME] ${fileName}`);

    // ✅ Convert File to Buffer
    console.log("🔄 [CONVERSION] Converting file to buffer...");
    const buffer = await file.arrayBuffer();
    console.log(`✅ [CONVERSION] Buffer size: ${buffer.byteLength} bytes`);

    // ✅ Upload to Google Drive
    console.log(`📤 [UPLOAD] Uploading to folder: ${BANKROLL_FOLDER_ID}`);
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
    console.log(`✅ [UPLOAD] File uploaded successfully!`);
    console.log(`   • File ID: ${fileId}`);
    console.log(`   • Web Link: https://drive.google.com/file/d/${fileId}/view`);

    // ✅ Make File Public
    console.log("🔓 [PERMISSIONS] Making file publicly readable...");
    await drive.permissions.create({
      auth,
      fileId: fileId!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    console.log("✅ [PERMISSIONS] File is now publicly readable");

    // ✅ Create Links
    const viewLink = `https://drive.google.com/file/d/${fileId}/view`;
    const downloadLink = `https://drive.google.com/uc?id=${fileId}&export=download`;

    console.log("═══════════════════════════════════════════");
    console.log("✅ [SUCCESS] Upload completed!");
    console.log(`   • View: ${viewLink}`);
    console.log(`   • Download: ${downloadLink}`);
    console.log("═══════════════════════════════════════════");

    // ✅ Return Success Response
    return NextResponse.json(
      {
        success: true,
        fileId: fileId,
        fileName: fileName,
        fileLink: viewLink,
        downloadLink: downloadLink,
        message: "File uploaded successfully to Google Drive",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("═══════════════════════════════════════════");
    console.error("❌ [ERROR] Upload failed!");
    console.error(`   • Error: ${String(error)}`);
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

// ✅ Handle other methods (GET, PUT, DELETE, etc)
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