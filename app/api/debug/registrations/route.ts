// app/api/debug/registrations/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 DEBUG: Rufe Registrations API auf...");

    // Nutze die bestehende API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/registrations`);
    const data = await response.json();

    console.log("📊 DEBUG Response:", JSON.stringify(data, null, 2));

    return NextResponse.json({
      status: "ok",
      count: Array.isArray(data) ? data.length : 0,
      data: data,
      rawResponse: JSON.stringify(data),
    });
  } catch (error) {
    console.error("❌ DEBUG Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
