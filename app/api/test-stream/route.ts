import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("=== TEST STREAM START ===");

    // Check ENV Variables
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    console.log("CLIENT_ID:", clientId ? "✓ SET" : "✗ MISSING");
    console.log("CLIENT_SECRET:", clientSecret ? "✓ SET" : "✗ MISSING");

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "Missing Twitch credentials",
          clientId: clientId ? "✓" : "✗",
          clientSecret: clientSecret ? "✓" : "✗",
        },
        { status: 400 }
      );
    }

    // Get Token
    console.log("Fetching token...");
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response status:", tokenResponse.status);
    console.log("Token data:", tokenData);

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          error: "Failed to get token",
          tokenResponse: tokenData,
        },
        { status: 400 }
      );
    }

    const token = tokenData.access_token;
    console.log("✓ Token obtained");

    // Get User
    const channel = "ileavemaybe";
    console.log(`Fetching user: ${channel}`);

    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${channel}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const userData = await userResponse.json();
    console.log("User response:", userData);

    if (!userData.data || userData.data.length === 0) {
      return NextResponse.json({
        error: "User not found",
        channel,
      });
    }

    const userId = userData.data[0].id;
    console.log(`✓ User found: ${userId}`);

    // Get Stream
    console.log(`Fetching stream for user: ${userId}`);

    const streamResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const streamData = await streamResponse.json();
    console.log("Stream response:", streamData);

    if (!streamData.data || streamData.data.length === 0) {
      return NextResponse.json({
        status: "OFFLINE",
        channel,
        userId,
      });
    }

    const stream = streamData.data[0];
    return NextResponse.json({
      status: "LIVE ✓",
      channel,
      userId,
      viewers: stream.viewer_count,
      title: stream.title,
      game: stream.game_name,
    });
  } catch (error: any) {
    console.error("ERROR:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}