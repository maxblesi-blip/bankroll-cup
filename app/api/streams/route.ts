import { NextRequest, NextResponse } from "next/server";

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getTwitchToken() {
  if (accessToken && tokenExpiry > Date.now()) {
    return accessToken;
  }

  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      return null;
    }

    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (error) {
    console.error("Token error:", error);
    return null;
  }
}

async function getStreamStatus(channel: string) {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
      return null;
    }

    const token = await getTwitchToken();
    if (!token) {
      return null;
    }

    const userRes = await fetch(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(channel)}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const userData = await userRes.json();

    if (!userData.data || userData.data.length === 0) {
      return { live: false, viewers: 0, thumbnail: "" };
    }

    const userId = userData.data[0].id;

    const streamRes = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const streamData = await streamRes.json();

    if (!streamData.data || streamData.data.length === 0) {
      return { live: false, viewers: 0, thumbnail: "" };
    }

    const stream = streamData.data[0];

    // Formatiere Thumbnail URL - ersetze Platzhalter
    let thumbnail = stream.thumbnail_url;
    if (thumbnail) {
      thumbnail = thumbnail
        .replace("{width}", "320")
        .replace("{height}", "180");
    }

    console.log(`Stream: ${channel}, Thumbnail: ${thumbnail}`);

    return {
      live: true,
      viewers: stream.viewer_count,
      thumbnail: thumbnail,
      title: stream.title,
    };
  } catch (error) {
    console.error(`Stream error for ${channel}:`, error);
    return { live: false, viewers: 0, thumbnail: "" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { channels } = await request.json();

    if (!channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { error: "Invalid channels" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      channels.map(async (channel: string) => {
        const status = await getStreamStatus(channel);
        return {
          channel,
          live: status?.live || false,
          viewers: status?.viewers || 0,
          thumbnail: status?.thumbnail || "",
          title: status?.title || "",
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}