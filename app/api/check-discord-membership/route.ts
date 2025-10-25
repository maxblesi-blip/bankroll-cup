// app/api/check-discord-membership/route.ts
import { NextRequest, NextResponse } from "next/server";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let discordUserId = body.discordUserId;

    // Debug Logging
    console.log("=== Discord Membership Check ===");
    console.log("Request body:", body);
    console.log("DISCORD_BOT_TOKEN set?", !!DISCORD_BOT_TOKEN);
    console.log("DISCORD_GUILD_ID:", DISCORD_GUILD_ID);
    console.log("Discord User ID:", discordUserId);

    // Validierung 1: Guild ID
    if (!DISCORD_GUILD_ID) {
      console.error("❌ DISCORD_GUILD_ID nicht gesetzt!");
      return NextResponse.json(
        {
          error: "❌ Server Konfiguration fehlt: DISCORD_GUILD_ID nicht in .env.local gesetzt",
          isMember: false,
          hint: 'Bitte setze "DISCORD_GUILD_ID" in .env.local und starte den Server neu',
        },
        { status: 500 }
      );
    }

    // Validierung 2: Bot Token
    if (!DISCORD_BOT_TOKEN) {
      console.error("❌ DISCORD_BOT_TOKEN nicht gesetzt!");
      return NextResponse.json(
        {
          error: "❌ Server Konfiguration fehlt: DISCORD_BOT_TOKEN nicht in .env.local gesetzt",
          isMember: false,
          hint: 'Bitte setze "DISCORD_BOT_TOKEN" in .env.local und starte den Server neu',
        },
        { status: 500 }
      );
    }

    // Validierung 3: User ID
    if (!discordUserId) {
      console.error("❌ Discord User ID nicht vorhanden!");
      console.error("Request Body war:", body);
      return NextResponse.json(
        {
          error: "❌ Discord User ID erforderlich",
          isMember: false,
          hint: "Die Discord User ID konnte nicht aus der Session extrahiert werden",
          receivedData: body,
        },
        { status: 400 }
      );
    }

    console.log(`✓ Überprüfe: User ${discordUserId} im Guild ${DISCORD_GUILD_ID}`);

    // Überprüfe ob User auf dem Discord Server ist
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Discord API Response Status: ${response.status}`);

    // Status 200 -> User ist auf dem Server ✓
    if (response.ok) {
      const memberData = await response.json();
      console.log(`✓ User ${discordUserId} ist Mitglied des Servers`);

      return NextResponse.json({
        isMember: true,
        nickname: memberData.nick || memberData.user?.username || "Member",
        joinedAt: memberData.joined_at,
        roles: memberData.roles || [],
      });
    }

    // Status 404 -> User ist NICHT auf dem Server ✗
    if (response.status === 404) {
      console.log(`✗ User ${discordUserId} ist NICHT Mitglied des Servers`);

      return NextResponse.json({
        isMember: false,
        message: "Benutzer ist nicht auf dem Discord Server",
      });
    }

    // Andere Fehler
    const errorText = await response.text();
    console.error(
      `❌ Discord API Error ${response.status}:`,
      errorText
    );

    return NextResponse.json(
      {
        error: `Discord API Error: ${response.status} ${response.statusText}`,
        isMember: false,
        details: errorText,
      },
      { status: response.status }
    );
  } catch (error) {
    console.error("❌ Unerwarteter Fehler:", error);
    return NextResponse.json(
      {
        error: "Fehler beim Überprüfen der Discord Mitgliedschaft",
        isMember: false,
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}