"use client";

import { useState, useEffect } from "react";
import { Loader } from "lucide-react";

interface Player {
  id: string;
  name: string;
  email: string;
  ggpokerNickname: string;
  bankroll: number;
  livestreamLink: string;
  lastVerification: string;
}

interface Stream {
  id: string;
  name: string;
  channel: string;
  url: string;
  live: boolean;
  viewers: number;
  thumbnail: string;
  title: string;
}

export default function Livestreams() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreams();

    // Auto-Refresh alle 15 Sekunden
    const interval = setInterval(() => {
      loadStreams();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadStreams = async () => {
    try {
      setLoading(true);

      // ✅ Lade Spieler von /api/leaderboard
      console.log("📡 Lade Spieler von /api/leaderboard...");
      const leaderboardResponse = await fetch("/api/leaderboard");
      const leaderboardData = await leaderboardResponse.json();

      // ✅ Extrahiere players Array aus Response
      const players: Player[] = leaderboardData.players || [];
      console.log(`📊 ${players.length} Spieler geladen`);

      // Filtere nur Spieler mit Livestream Link
      const streamPlayers = players.filter(
        (p) => p.livestreamLink && p.livestreamLink.trim() !== ""
      );

      console.log(`🎬 ${streamPlayers.length} Spieler mit Livestream Link`);

      if (streamPlayers.length === 0) {
        console.log("ℹ️  Keine Livestream Links gefunden");
        setStreams([]);
        setLoading(false);
        return;
      }

      // Extrahiere Channel Names aus URLs
      const channels = streamPlayers
        .map((p) => {
          const url = p.livestreamLink;
          console.log(`   URL: ${url}`);

          // ✅ Extrahiere Twitch Channel Name
          let channel = "";
          if (url.includes("twitch.tv/")) {
            channel = url
              .split("twitch.tv/")[1]
              ?.split("/")[0]
              ?.split("?")[0]
              ?.toLowerCase()
              ?.trim() || "";
          }

          console.log(`   → Channel: ${channel}`);
          return channel;
        })
        .filter((c) => c);

      console.log(`🔗 Channels für Twitch API: [${channels.join(", ")}]`);

      if (channels.length === 0) {
        console.warn("⚠️  Keine gültigen Twitch Channels extrahiert");
        setStreams([]);
        setLoading(false);
        return;
      }

      // ✅ Rufe Twitch API auf mit Channels Array
      console.log("🔄 Rufe Twitch API auf...");
      const streamsResponse = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
      });

      const streamStatuses = await streamsResponse.json();
      console.log(`✅ Stream Statuses erhalten:`, streamStatuses);

      // Kombiniere Spieler + Stream Status - NUR LIVE
      const streamData: Stream[] = streamPlayers
        .map((player, idx) => {
          const url = player.livestreamLink;
          
          // Extrahiere Channel Name
          let channel = "";
          if (url.includes("twitch.tv/")) {
            channel = url
              .split("twitch.tv/")[1]
              ?.split("/")[0]
              ?.split("?")[0]
              ?.toLowerCase()
              ?.trim() || "";
          }

          const status = streamStatuses[idx] || {
            live: false,
            viewers: 0,
            thumbnail: "",
            title: "",
          };

          return {
            id: player.id,
            name: player.name,
            channel: channel,
            url: url,
            live: status.live || false,
            viewers: status.viewers || 0,
            thumbnail: status.thumbnail || "",
            title: status.title || "",
          };
        })
        .filter((s) => s.live); // NUR LIVE STREAMS

      console.log(`🔴 ${streamData.length} Live Streams gefunden`);
      setStreams(streamData);
    } catch (error) {
      console.error("❌ Error loading streams:", error);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && streams.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center gap-3">
        <Loader className="animate-spin" size={32} />
        <p className="text-slate-400 text-lg">Lade Live Streams...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🔴 Live Streams</h1>
        <p className="text-slate-400">{streams.length} aktive Streams</p>
      </div>

      {streams.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-16 text-center">
          <p className="text-slate-300 text-xl font-bold mb-2">
            Keine Live-Streams aktiv
          </p>
          <p className="text-slate-400">Schaue später vorbei!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <button
              key={stream.id}
              onClick={() => window.open(stream.url, "_blank")}
              className="relative group cursor-pointer text-left hover:scale-105 transition-transform duration-200"
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden rounded-lg bg-slate-900 aspect-video mb-3">
                {stream.thumbnail && (
                  <img
                    src={stream.thumbnail}
                    alt={stream.name}
                    className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                    onError={(_e) => {
                      console.error(`Thumbnail Error für ${stream.name}`);
                    }}
                  />
                )}

                {/* LIVE Badge */}
                <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold animate-pulse">
                  🔴 LIVE
                </div>

                {/* Viewer Count */}
                <div className="absolute bottom-3 right-3 bg-black/80 text-white px-3 py-1 rounded text-sm font-bold">
                  👥 {stream.viewers.toLocaleString()}
                </div>
              </div>

              {/* Info */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 group-hover:border-purple-500 transition-colors">
                <h3 className="font-bold text-lg text-white mb-1 truncate">
                  {stream.name}
                </h3>
                <p className="text-slate-400 text-sm mb-2 truncate">
                  @{stream.channel}
                </p>
                <p className="text-slate-300 text-xs line-clamp-2 mb-3">
                  {stream.title || "Twitch Stream"}
                </p>

                <div className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs font-bold text-center">
                  🎮 Twitch
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}