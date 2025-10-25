// app/rangliste/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, RefreshCw } from "lucide-react";

interface Player {
  rank: number;
  name: string;
  ggpokerNickname: string;
  bankroll: number;
  startBankroll: number;
  percentToGoal: number;
  lastVerification: string;
  livestreamLink?: string;
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

interface LeaderboardResponse {
  players: Player[];
  chartData: ChartData[];
  lastUpdated: string;
}

export default function Rangliste() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Daten von API abrufen
  const fetchLeaderboardData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      const response = await fetch("/api/leaderboard");

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }

      const data: LeaderboardResponse = await response.json();
      setPlayers(data.players || []);
      setChartData(data.chartData || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setError("Fehler beim Laden der Rangliste");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Initialer Datenladevorgang
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Auto-Refresh alle 30 Sekunden
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboardData();
    }, 30000); // 30 Sekunden

    return () => clearInterval(interval);
  }, []);

  const progressToGoal = (bankroll: number) => {
    return Math.min((bankroll / 5000) * 100, 100);
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Nie";
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "gerade eben";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)}h`;
    return date.toLocaleDateString("de-DE");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <RefreshCw size={40} className="text-blue-400" />
            </div>
            <p className="text-slate-400">Rangliste wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Rangliste</h1>
        <p className="text-slate-400">
          Verfolge den Fortschritt aller Spieler im MP Bankroll Cup
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Timeframe Selection */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={18} />
            <span>Zeitraum:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {["week", "month", "all"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeframe === t
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {t === "week" && "Diese Woche"}
                {t === "month" && "Diesen Monat"}
                {t === "all" && "Gesamte Serie"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchLeaderboardData}
            disabled={refreshing}
            className="ml-auto px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition flex items-center gap-2 text-slate-300"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Aktualisieren
          </button>
        </div>
        {lastUpdate && (
          <p className="text-xs text-slate-500 mt-3">
            Zuletzt aktualisiert: {formatTimeAgo(lastUpdate)}
          </p>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-400" />
            Bankroll Verlauf
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                formatter={(value) => `€${value}`}
              />
              <Legend />
              {players.slice(0, 4).map((player, index) => {
                const colors = [
                  "#fbbf24",
                  "#a78bfa",
                  "#60a5fa",
                  "#34d399",
                ];
                return (
                  <Line
                    key={player.name}
                    type="monotone"
                    dataKey={player.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  Platz
                </th>
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  Spieler
                </th>
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  GGPoker Nickname
                </th>
                <th className="px-6 py-4 text-right font-bold text-slate-300">
                  Bankroll
                </th>
                <th className="px-6 py-4 text-center font-bold text-slate-300">
                  Fortschritt
                </th>
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  Letzte Verifikation
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={player.rank}
                  className={`border-b border-slate-700 hover:bg-slate-700 transition ${
                    index === 0 ? "bg-slate-700/50" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    {index === 0 ? (
                      <div className="text-2xl font-bold text-yellow-400">
                        🥇
                      </div>
                    ) : index === 1 ? (
                      <div className="text-2xl">🥈</div>
                    ) : index === 2 ? (
                      <div className="text-2xl">🥉</div>
                    ) : (
                      <span className="font-bold text-lg">#{player.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {player.livestreamLink ? (
                      <a
                        href={player.livestreamLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {player.name}
                      </a>
                    ) : (
                      player.name
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {player.ggpokerNickname}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold">€{player.bankroll}</span>
                    <div className="text-sm text-slate-400">
                      +€{player.bankroll - player.startBankroll}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${progressToGoal(player.bankroll)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {Math.round(progressToGoal(player.bankroll))}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(player.lastVerification).toLocaleDateString(
                      "de-DE"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Teilnehmer</h3>
          <p className="text-3xl font-bold">{players.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Führender Spieler</h3>
          <p className="text-3xl font-bold">{players[0]?.name}</p>
          <p className="text-yellow-400 text-sm">€{players[0]?.bankroll}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Fortschritt zum Ziel</h3>
          <p className="text-3xl font-bold">
            {Math.round((players[0]?.bankroll / 5000) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}